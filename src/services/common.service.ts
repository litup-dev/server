import { ReviewCategoryType } from '@/schemas/common.schema.js';
import { PrismaClient } from '@prisma/client';

export class CommonService {
    constructor(private prisma: PrismaClient) {}

    async getReviewCategory(): Promise<ReviewCategoryType> {
        const categories = await this.prisma.keyword_category_code.findMany({
            include: {
                keyword_tb: {
                    orderBy: {
                        sort_order: 'asc',
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });

        return categories.map((category) => ({
            id: category.id,
            code: category.code || '',
            name: category.name || '',
            keywords: category.keyword_tb.map((keyword) => ({
                id: keyword.id,
                keyword: keyword.name || '',
                iconPath: keyword.icon_path || '',
                sortOrder: keyword.sort_order || 0,
            })),
        }));
    }
}
