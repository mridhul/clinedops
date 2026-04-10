import '@testing-library/jest-dom/vitest'
import * as React from 'react'

// Some test environments still expect React in scope for classic JSX.
globalThis.React = React

// Ant Design relies on matchMedia for responsive behavior.
// jsdom doesn’t implement it by default.
// Ant Design Table / Modal use getComputedStyle for scrollbar measurement.
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

