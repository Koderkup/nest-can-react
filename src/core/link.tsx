import React from 'react';

type NestLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  to: string;
};

export function NestLink({ to, children, ...props }: NestLinkProps) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}
