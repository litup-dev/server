import { PrismaClient } from '@prisma/client';
import { redis } from '@/configs/redis.js';
import * as crypto from 'crypto';

export class NicknameService {
    private readonly CACHE_PREFIX_KEY = 'nickname:store:';
    private readonly GENRE_KEY = this.CACHE_PREFIX_KEY + 'genre';
    private readonly ADJECTIVE_KEY = this.CACHE_PREFIX_KEY + 'adjective';
    private readonly SPECIES_KEY = this.CACHE_PREFIX_KEY + 'species';

    constructor(private prisma: PrismaClient) {}

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
            redis.set(this.GENRE_KEY, JSON.stringify(genres.map((item) => item.word))),
            redis.set(this.ADJECTIVE_KEY, JSON.stringify(adjectives.map((item) => item.word))),
            redis.set(this.SPECIES_KEY, JSON.stringify(species.map((item) => item.word))),
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
    // 15개 후보 생성 후 in 쿼리로 중복 검사
    // 중복 안된 첫번째를 닉네임으로 반환.
    // 만약 모두 중복이면 이메일 기반 해시값에서 6자리 추출
    async generateNickname(email: string): Promise<string> {
        // redis에서 단어 리스트 불러오기
        const [genre, adjective, species] = await Promise.all([
            redis.get(this.GENRE_KEY),
            redis.get(this.ADJECTIVE_KEY),
            redis.get(this.SPECIES_KEY),
        ]);
        const genreList: string[] = JSON.parse(genre!);
        const adjectiveList: string[] = JSON.parse(adjective!);
        const speciesList: string[] = JSON.parse(species!);

        const pickedNicknames: string[] = [];
        for (let i = 0; i < 15; i++) {
            const gIdx = Math.floor(Math.random() * genreList.length);
            const aIdx = Math.floor(Math.random() * adjectiveList.length);
            const sIdx = Math.floor(Math.random() * speciesList.length);
            const nickname = `${genreList[gIdx]} ${adjectiveList[aIdx]} ${speciesList[sIdx]}`;
            pickedNicknames.push(nickname);
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
