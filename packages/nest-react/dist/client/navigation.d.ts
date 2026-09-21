type NavigationOptions = {
    onPageChanged: () => void;
};
export declare function installNavigation(options: NavigationOptions): void;
export declare function navigateTo(href: string): Promise<void>;
export declare function refresh(): Promise<void>;
export {};
