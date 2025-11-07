import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";
import { type GetUsersResponse } from "@/types/browse";

export interface Filters {
  minAge?: number;
  maxAge?: number;
  minFame?: number;
  maxFame?: number;
  locations?: string[];
  tags?: string[];
  firstName?: string;
  sort?: {
    sortBy: 'age' | 'fameRating' | 'interests';
    sortOrder: 'asc' | 'desc';
  };
}

export function useUsers(params?: Filters) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['users', params],
    queryFn: ({ pageParam }) => {

      // Parse locations, so we can use it in the HTTP request params: "City, Country" -> { city: "City", country: "Country" }
      let cities: string[] = [];
      let countries: string[] = [];
      for (const location of params?.locations || []) {
        const parts = location.split(',').map(p => p.trim());
        cities.push(parts[0] || '');
        countries.push(parts[1] || '');
      }
      return userApi.getUsers({
        cursor: pageParam as string | undefined,
        minAge: params?.minAge,
        maxAge: params?.maxAge,
        minFame: params?.minFame,
        maxFame: params?.maxFame,
        cities: cities.length > 0 ? cities : undefined,
        countries: countries.length > 0 ? countries : undefined,
        tags: params?.tags && params.tags.length > 0 ? params.tags : undefined,
        firstName: params?.firstName,
        sort: params?.sort,
      });
    },
    getNextPageParam: (lastPage: GetUsersResponse) => {
      if (lastPage.hasMore && lastPage.nextCursor) {
        return lastPage.nextCursor;
      }
      return undefined;
    },
    initialPageParam: undefined,
  });

  const users = query.data?.pages.flatMap(page => page.users) ?? [];
  const hasMore = query.data?.pages[query.data.pages.length - 1]?.hasMore ?? false;

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return {
    users,
    hasMore,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    invalidateUsers,
  };
}
