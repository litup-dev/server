import { PrismaClient } from '@prisma/client';
import { redis } from '@/configs/redis.js';
import * as crypto from 'crypto';

export class NicknameService {
    private readonly CACHE_PREFIX_KEY = 'nickname:store:';
    private readonly GENRE_KEY = this.CACHE_PREFIX_KEY + 'genre';
    private readonly ADJECTIVE_KEY = this.CACHE_PREFIX_KEY + 'adjective';
    private readonly SPECIES_KEY = this.CACHE_PREFIX_KEY + 'species';

    constructor(private prisma: PrismaClient) {}

    private groupByLength(words: string[]): Record<string, string[]> {
        const groups: Record<string, string[]> = {};
        words.forEach((word) => {
            const len = word.replace(/\s+/g, '').length;
            if (!groups[len]) groups[len] = [];
            groups[len].push(word);
        });
        return groups;
    }

    async init(): Promise<void> {
        console.log('Nickname cache initialization started.');

        const [genres, adjectives, species] = await Promise.all([
            this.prisma.nickname_word_tb.findMany({
                where: { category: 'genre' },
                select: { word: true },
            }),
            this.prisma.nickname_word_tb.findMany({
                where: { category: 'adjective' },
                select: { word: true },
            }),
            this.prisma.nickname_word_tb.findMany({
                where: { category: 'species' },
                select: { word: true },
            }),
        ]);

        await Promise.all([
            redis.set(
                this.GENRE_KEY,
                JSON.stringify(this.groupByLength(genres.map((item) => item.word)))
            ),
            redis.set(
                this.ADJECTIVE_KEY,
                JSON.stringify(this.groupByLength(adjectives.map((item) => item.word)))
            ),
            redis.set(
                this.SPECIES_KEY,
                JSON.stringify(this.groupByLength(species.map((item) => item.word)))
            ),
        ]);

        console.log('Nickname cache initialization completed.');
    }

    private generateFallbackNickname(email: string): string {
        const hash = crypto.createHash('sha256').update(email).digest('hex');
        const value = parseInt(hash.substring(0, 12), 16); // 생성된 해시의 앞 12자리를 가져온 뒤 16진수를 10진수로 변환
        const digitNickname = (value % 900000) + 100000;
        return digitNickname.toString();
    }

    // 닉네임 생성
    // 만약 모두 중복이면 이메일 기반 해시값에서 6자리 추출
    async generateNickname(email: string): Promise<string> {
        // redis에서 그룹된 단어 리스트 불러오기
        const [genre, adjective, species] = await Promise.all([
            redis.get(this.GENRE_KEY),
            redis.get(this.ADJECTIVE_KEY),
            redis.get(this.SPECIES_KEY),
        ]);

        if (!genre || !adjective || !species) {
            console.error('닉네임 생성에 사용할 단어 리스트를 찾을 수 없습니다.');
            return this.generateFallbackNickname(email);
        }

        const genreByLen: Record<string, string[]> = JSON.parse(genre!);
        const adjectiveByLen: Record<string, string[]> = JSON.parse(adjective!);
        const speciesByLen: Record<string, string[]> = JSON.parse(species!);

        // 총 12글자가 되는 조합을 찾음
        const validCombinations: [number, number, number][] = [];
        for (const gLen of Object.keys(genreByLen)) {
            for (const aLen of Object.keys(adjectiveByLen)) {
                for (const sLen of Object.keys(speciesByLen)) {
                    const totalLen = Number(gLen) + Number(aLen) + Number(sLen);
                    if (totalLen <= 12) {
                        validCombinations.push([Number(gLen), Number(aLen), Number(sLen)]);
                    }
                }
            }
        }

        if (validCombinations.length === 0) {
            console.error('닉네임 조합을 찾을 수 없습니다.');
            return this.generateFallbackNickname(email);
        }

        const pickedNicknames: string[] = [];
        for (let i = 0; i < 15; i++) {
            const comboIdx = Math.floor(Math.random() * validCombinations.length);
            const [gLen, aLen, sLen] = validCombinations[comboIdx]!;

            const gCandidates = genreByLen[gLen]!;
            const aCandidates = adjectiveByLen[aLen]!;
            const sCandidates = speciesByLen[sLen]!;

            const genre = gCandidates[Math.floor(Math.random() * gCandidates.length)];
            const adjective = aCandidates[Math.floor(Math.random() * aCandidates.length)];
            const species = sCandidates[Math.floor(Math.random() * sCandidates.length)];
            pickedNicknames.push(`${genre}${adjective}${species}`);
        }

        const checkedNickNames = await this.prisma.user_tb.findMany({
            where: {
                nickname: { in: pickedNicknames },
            },
            select: { nickname: true },
        });

        const setNickNames = new Set(checkedNickNames.map((item) => item.nickname));
        const unique = pickedNicknames.find((item) => !setNickNames.has(item));

        if (unique) return unique;

        console.info('랜덤 닉네임 15개 모두 중복으로 숫자 닉네임으로 변경.');
        return this.generateFallbackNickname(email);
    }
}
