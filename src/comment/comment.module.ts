import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PostService } from 'src/post/post.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommentController],
  providers: [CommentService, PostService]
})
export class CommentModule {}
