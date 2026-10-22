import type { SVGProps } from 'react';

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="square"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            {children}
        </svg>
    );
}

export function ArrowLeftIcon() {
    return (
        <Icon>
            <path d="M16 10H4M9 5l-5 5 5 5" />
        </Icon>
    );
}

export function ArrowRightIcon() {
    return (
        <Icon>
            <path d="M4 10h12M11 5l5 5-5 5" />
        </Icon>
    );
}

export function ExternalIcon() {
    return (
        <Icon width="15" height="15">
            <path d="M8 4H4v12h12v-4M11 4h5v5M16 4l-7 7" />
        </Icon>
    );
}
