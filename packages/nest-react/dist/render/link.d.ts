import React from 'react';
type NestLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    to: string;
};
export declare function NestLink({ to, children, ...props }: NestLinkProps): React.JSX.Element;
export {};
