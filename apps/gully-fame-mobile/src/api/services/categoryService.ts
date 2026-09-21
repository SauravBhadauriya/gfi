import apiClient from "../axios";
import { ApiResponse } from "../types";
import API_ENDPOINTS from "../endpoints";

export interface Category {
    id: string;
    name: string;
    icon?: string;
    image?: string;
    [key: string]: any;
}

export interface CategoriesResponse {
    items: Category[];
    total?: number;
    page?: number;
    limit?: number;
}

export async function getCategories(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<CategoriesResponse>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;

    try {
        // Postman spec: GET /user/categories?page=1&limit=50
        const response = await apiClient.get<any>('user/categories', {
            skipAuth: false,
            params: { page, limit },
        });
        const responseData = response.data as any;
        console.log(
            `[Categories] page=${page} limit=${limit} code=${responseData.code} items=${responseData.data?.categories?.length || 0}`,
        );
        if (responseData.code === 1 && responseData.data) {
            let rawItems: any[] = [];
            const payload = responseData.data;

            if (Array.isArray(payload)) {
                rawItems = payload;
            } else if (Array.isArray(payload.items)) {
                rawItems = payload.items;
            } else if (Array.isArray(payload.categories)) {
                rawItems = payload.categories;
            } else if (Array.isArray(payload.data)) {
                rawItems = payload.data;
            }

            const items: Category[] = rawItems.map((c) => ({
                id:
                    c.id?.toString?.() ||
                    c._id?.toString?.() ||
                    c.categoryId?.toString?.() ||
                    "",
                name: c.name || c.title || c.label || "",
                icon: c.icon,
                image: c.image || c.banner,
                ...c,
            }));

            const result: CategoriesResponse = {
                items,
                total: payload.totalCategories || payload.total || rawItems.length,
                page: payload.page || page,
                limit: payload.limit || limit,
            };

            return {
                success: true,
                data: result,
                message:
                    responseData.message || "Categories fetched successfully",
            };
        }

        return {
            success: false,
            message: responseData.message || "Failed to fetch categories",
            error: "API returned unsuccessful response",
            data: undefined,
        };
    } catch (error: any) {
        console.error("[categoryService] getCategories error:", error.message);
        return {
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                "Network error occurred",
            error: error.message || "Network error",
            data: undefined,
        };
    }
}

export const categoryService = {
    getCategories,
};
