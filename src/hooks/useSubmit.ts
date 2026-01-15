import { useState } from 'react';

type SubmitFunction<T, R> = (data: T) => Promise<R>;

interface UseSubmitResult<T, R> {
    isLoading: boolean;
    error: string | null;
    response: R | null;
    handleSubmit: (data: T) => Promise<void>;
}

export function useSubmit<T, R>(submitFunction: SubmitFunction<T, R>): UseSubmitResult<T, R> {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<R | null>(null);

    const handleSubmit = async (data: T) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await submitFunction(data);
            setResponse(res);
        } catch (err: any) {
            setError(err.message || 'Error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, error, response, handleSubmit };
}
