import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { BASE_URL } from "@/api/axios";

export interface HomeScreenData {
    banners: any[];
    trending: any[];
    liveCompetitions: any[];
    pastCompetitions: any[];
    upcomingCompetitions: any[];
    topCompetitors: any[];
    categories: any[];
}

const FALLBACK_DATA: HomeScreenData = {
    banners:              [],
    trending:             [],
    liveCompetitions:     [],
    pastCompetitions:     [],
    upcomingCompetitions: [],
    topCompetitors:       [],
    categories:           [],
};

// ✅ Relative image path ko full URL mein convert karo
const toFullUrl = (path: string | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // already full URL
    // BASE_URL = "http://103.194.228.68:3552/v1/api/"
    // Image server = "http://103.194.228.68:3552"
    const serverUrl = BASE_URL?.replace('/v1/api/', '') ?? '';
    return `${serverUrl}${path}`;
};

async function fetchHomeScreen(): Promise<HomeScreenData> {
    console.log('🔄 [HomeScreen] API call...');
    try {
        const resp = await apiClient.get("/user/homeScreen");
        console.log('✅ [HomeScreen] Success:', resp.status);

        const data = resp.data?.data;
        if (!data) return FALLBACK_DATA;

        // ✅ Banners — image path fix karo
        const banners = data.banners?.map((b: any) => ({
            ...b,
            image: toFullUrl(b.image),
        })) ?? heroSlides;

        // ✅ Categories — icon path fix karo
        const categories = data.categories?.map((c: any) => ({
            ...c,
            icon: toFullUrl(c.icon),
            image: toFullUrl(c.image),
        })) ?? [];

        // ✅ Trending — image fix karo
        const trending = data.trending?.map((t: any) => ({
            ...t,
            image: toFullUrl(t.image),
        })) ?? [];

        // ✅ Upcoming competitions
        const upcomingCompetitions = data.upcomingCompetitions?.map((c: any) => ({
            ...c,
            image: toFullUrl(c.image),
        })) ?? [];

        // ✅ Past competitions
        const pastCompetitions = data.pastCompetitions?.map((c: any) => ({
            ...c,
            image: toFullUrl(c.image),
        })) ?? [];

        // ✅ Live competitions — API mein nahi hai, upcoming se filter karo
        // Jab backend add kare tab update hoga
        const liveCompetitions = data.liveCompetitions?.map((c: any) => ({
            ...c,
            image: toFullUrl(c.image),
        })) ?? [];

        // ✅ Top competitors
        const topCompetitors = data.topCompetitors?.map((c: any) => ({
            ...c,
            image: toFullUrl(c.image),
        })) ?? [];

        console.log('✅ Data processed:', {
            banners: banners.length,
            categories: categories.length,
            trending: trending.length,
            upcoming: upcomingCompetitions.length,
            past: pastCompetitions.length,
        });

        return {
            banners,
            categories,
            trending,
            upcomingCompetitions,
            pastCompetitions,
            liveCompetitions,
            topCompetitors,
        };

    } catch (error: any) {
        console.log('❌ [HomeScreen] Failed:', error.message);
        return FALLBACK_DATA;
    }
}

export function useHomeScreen() {
    const query = useQuery({
        queryKey: ["homeScreen"],
        queryFn: fetchHomeScreen,
        staleTime: 1000 * 60 * 5,
        retry: 1,
        placeholderData: FALLBACK_DATA,
    });

    return {
        banners:              query.data?.banners              ?? [],
        trending:             query.data?.trending             ?? [],
        liveCompetitions:     query.data?.liveCompetitions     ?? [],
        pastCompetitions:     query.data?.pastCompetitions     ?? [],
        upcomingCompetitions: query.data?.upcomingCompetitions ?? [],
        topCompetitors:       query.data?.topCompetitors       ?? [],
        categories:           query.data?.categories           ?? [],
        isLoading:  query.isLoading,
        isFetching: query.isFetching,
        isError:    query.isError,
        error:      query.error,
        refetch:    query.refetch,
    };
}