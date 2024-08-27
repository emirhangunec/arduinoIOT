interface ApiResponse<T> {
    data: {
        message: string;
        data: T;
    };
    status: 'success' | 'error' | 'pending';
    error: Error | null;
}