import { apiResponseArrayWrapper } from './apiResponseArrayWrapper.factory';

describe('Validate apiResponseArrayWrapper class', () => {
  it('should be defined', () => {
    expect(apiResponseArrayWrapper(Array)).toBeDefined();
  });
});
