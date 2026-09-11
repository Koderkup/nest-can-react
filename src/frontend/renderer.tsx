import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export function renderPage(Page: React.ComponentType) {
  return '<!DOCTYPE html>' +
    renderToStaticMarkup(<Page />);
}