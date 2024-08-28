interface ApiResponse<T> {
    data: T;
    status: 'success' | 'error' | 'pending';
    error: Error | null;
}

interface ApiResponseWithMessage<T> extends ApiResponse<T> {
    data: {
        message: string;
        data: T;
    }
}