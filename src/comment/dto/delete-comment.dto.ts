import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteCommentDto {
    @ApiProperty({ description: 'comment ID' })
    @IsUUID()
    @IsNotEmpty()
    commentId: string;
}
