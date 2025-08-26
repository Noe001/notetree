import { cn } from '../utils';

describe('cn utility', () => {
  test('merges class names correctly', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
});
