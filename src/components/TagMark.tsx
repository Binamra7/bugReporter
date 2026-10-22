/** The product mark: a defect tag with a punched hole. Drawn in currentColor so it prints on either surface. */
export function TagMark({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path fill="currentColor" fillRule="evenodd" d="M11 3h18v26H11L2 16zM11 13a3 3 0 1 0 0 6a3 3 0 1 0 0-6z" />
        </svg>
    );
}
