interface ApiResponse<T> {
    data: T;
    status: 'success' | 'error' | 'pending';
    error: Error | null;
}