function promisify<T extends (...args: any[]) => void>(
    fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T> extends void ? void : ReturnType<T>> {
    return (...args: Parameters<T>): Promise<ReturnType<T> extends void ? void : ReturnType<T>> => {
        return new Promise((resolve, reject) => {
            function callback(err: any, result: any): void {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }

            args.push(callback);

            fn.call(this, ...args);
        });
    };
}

export { promisify };
