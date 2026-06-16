interface CloudLogoProps {
    size?: number;
    /** When true, renders the muted/lavender variant used in card corners. */
    muted?: boolean;
    /** When true, renders a solid white cloud (for use on dark/purple panels). */
    white?: boolean;
}

/**
 * The Umbrelly cloud mark. A rounded cloud silhouette with the small
 * tail notch on the lower-left, matching the brand logo in the deck.
 */
export function CloudLogo({ size = 28, muted = false, white = false }: CloudLogoProps) {
    const fill = white ? '#ffffff' : muted ? '#b9a9f5' : 'url(#umb-cloud-grad)';
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Umbrelly"
            role="img"
        >
            {!white && !muted && (
                <defs>
                    <linearGradient id="umb-cloud-grad" x1="6" y1="14" x2="58" y2="50" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#6d4aff" />
                    </linearGradient>
                </defs>
            )}
            <path
                d="M20.5 50.5c-7.5 0-13.5-5.7-13.5-12.9 0-6.4 4.8-11.7 11.2-12.7C20.7 18.7 27 14 34.4 14c8.1 0 14.9 5.6 16.3 13 6 .6 10.8 5.4 10.8 11.5 0 6.6-5.6 12-12.6 12H20.5Z"
                fill={fill}
            />
            <path
                d="M18.8 50.2c-2.4 2.6-6 3.9-9.6 3.2 2-1 3.4-2.6 4.2-4.6.6-1.6 2.6-2.1 3.9-1l1.5 2.4Z"
                fill={fill}
            />
        </svg>
    );
}
