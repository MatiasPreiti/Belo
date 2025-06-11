import { ApiProperty } from '@nestjs/swagger';
import { StackFrame } from 'error-stack-parser';

class DetailsProperties {
  @ApiProperty()
  columnNumber: string;

  @ApiProperty()
  lineNumber: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  functionName: string;

  @ApiProperty()
  source: string;
}

export class ErrorResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  code: number;

  @ApiProperty({ type: [DetailsProperties] })
  details: StackFrame[] | null;
}
