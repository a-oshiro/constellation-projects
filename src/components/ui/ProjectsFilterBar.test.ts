import { describe, expect, it } from 'vitest';
import { lastUpdatedBucket } from './ProjectsFilterBar';

describe('lastUpdatedBucket', () => {
  it.each([
    ['Just now', 'Today'],
    ['1 hour ago', 'Today'],
    ['3 hours ago', 'Today'],
    ['Yesterday', 'Yesterday'],
    ['2 days ago', 'Past week'],
    ['4 days ago', 'Past week'],
    ['1 week ago', 'Past 2 weeks'],
    ['2 weeks ago', 'Past 2 weeks'],
    ['3 weeks ago', 'Older'],
    ['some day', 'Older'],
  ])('%s → %s', (text, bucket) => {
    expect(lastUpdatedBucket(text)).toBe(bucket);
  });
});
