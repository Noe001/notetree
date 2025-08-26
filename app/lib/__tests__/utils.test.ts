import { cn } from '../utils';

describe('cn utility', () => {
  test('merges class names correctly', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  test('handles falsy values and objects', () => {
    expect(cn('a', null, 'b', undefined, 'c')).toBe('a b c');
    expect(cn({ a: true, b: false, c: true })).toBe('a c');
  });

  test('resolves tailwind class conflicts', () => {
    expect(cn('px-2 py-1', 'p-3')).toBe('p-3');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
