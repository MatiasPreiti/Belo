import { apiErrorWrapper } from './apiErrorWrapper.factory';

describe('Validate apiErrorWrapper class', () => {
  it('should be defined', () => {
    expect(apiErrorWrapper(Object)).toBeDefined();
  });
});
