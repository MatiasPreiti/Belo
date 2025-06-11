import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export function apiResponseArrayWrapper(type: Type): any {
  class ResponseWrapperArray {
    @ApiProperty({ type: [type] })
    public data: Type[];
  }

  Object.defineProperty(ResponseWrapperArray, 'name', {
    value: `ResponseWrapperArrayFor${type.name}`,
  });

  return ResponseWrapperArray;
}
