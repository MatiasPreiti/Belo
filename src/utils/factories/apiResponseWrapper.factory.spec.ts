import { apiResponseWrapper } from './apiResponseWrapper.factory';

describe('Validate apiResponseWrapper class', () => {
  it('should be defined', () => {
    expect(apiResponseWrapper(Object)).toBeDefined();
  });
});
