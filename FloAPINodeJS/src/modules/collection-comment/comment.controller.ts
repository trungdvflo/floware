import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post, Put, Query,
    Req, UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllFilter4CollectionAdnUID, GetByCollectionID } from '../../common/dtos/get-all-filter';
import { CollectionActivity } from '../../common/entities/collection-activity.entity';
import { CollectionComment } from '../../common/entities/collection-comment.entity';
import { MentionUser } from '../../common/entities/mention-user.entity';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CommentService } from './comment.service';
import { CreateCommentDto, CreateCommentDtos } from './dtos/comment.create.dto';
import { DeleteCommentDto, DeleteCommentDtos } from './dtos/comment.delete.dto';
import {
    CommentCreateResponse, CommentGetResponse, CommentUpdateResponse, DeleteCommentResponse
} from './dtos/comment.respone-sample.swagger';
import { UpdateCommentDto, UpdateCommentDtos } from './dtos/comment.update.dto';
@ApiTags('Comment')
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.commentCtr.mainPath)
export class CommentController {
    constructor(
        private readonly commentService: CommentService
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get all comment',
        description:
            'Get all comment of the collection',
    })
    @ApiResponse(CommentGetResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async index(
        @Query(new GetAllValidationPipe({ entity: CollectionComment }))
        filter: GetAllFilter4CollectionAdnUID<CollectionComment & CollectionActivity>,
        @Req() req,
    ) {
        const dataRespond = await this.commentService
            .getComments(filter, req as IReq);
        return dataRespond;
    }

    @Get(routestCtr.commentCtr.mentionPath)
    @ApiOperation({
        summary: 'Get all users in the collection for mention in comment',
        description:
            'Get all users in the collection for mention comment of the collection',
    })
    @ApiResponse(CommentGetResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async getMentionUser(
        @Query(new GetAllValidationPipe({ entity: MentionUser }))
        filter: GetByCollectionID<MentionUser>,
        @Req() req,
    ) {
        const dataRespond = await this.commentService
            .getAllMentionsUser(filter, req as IReq);
        return dataRespond;
    }

    @Post()
    @ApiOperation({
        summary: 'Create list of comment',
        description:
            'Create list of comment and return the creator\'s comment properties',
    })
    @ApiResponse(CommentCreateResponse.RES_200)
    @HttpCode(HttpStatus.CREATED)
    async createComment(
        @Body(new BatchValidationPipe({ items: CreateCommentDto, key: 'data' }))
        body: CreateCommentDtos,
        @Req() req,
    ) {
        const { data, errors } = body;
        if (data.length === 0) {
            return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
        }
        const { itemPass, itemFail } = await this.commentService
            .createBatchComment(data, req as IReq);
        if (itemFail && itemFail.length > 0) {
            itemFail.forEach((item) => errors.push(item));
        }
        const dataRespond: IDataRespond = new Object();
        // Just respond fields have value
        if (itemPass.length > 0) dataRespond.data = itemPass;
        if (errors.length > 0) dataRespond.errors = errors;
        return new MultipleRespond(dataRespond).multipleRespond();
    }

    @ApiOperation({
        summary: 'Update list of comments',
        description:
            'Update list of comments',
    })
    @Put()
    @ApiResponse(CommentUpdateResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async updateComment(
        @Body(new BatchValidationPipe({ items: UpdateCommentDto, key: 'data' }))
        body: UpdateCommentDtos,
        @Req() req,
    ) {
        const { data, errors } = body;
        if (data.length === 0) {
            return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
        }
        const { itemPass, itemFail } = await this.commentService
            .updateBatchComment(data, req as IReq);
        if (itemFail && itemFail.length > 0) {
            itemFail.forEach((item) => errors.push(item));
        }
        const dataRespond: IDataRespond = new Object();
        // Just respond fields have value
        if (itemPass.length > 0) dataRespond.data = itemPass;
        if (errors.length > 0) dataRespond.errors = errors;
        return new MultipleRespond(dataRespond).multipleRespond();
    }

    @ApiOperation({
        summary: 'Remove comments',
        description:
            'Remove list of comments',
    })
    @Post(routestCtr.commentCtr.deletePath)
    @ApiResponse(DeleteCommentResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async deleteComment(
        @Body(new BatchValidationPipe({ items: DeleteCommentDto, key: 'data' }))
        body: DeleteCommentDtos,
        @Req() req,
    ) {
        const { data, errors } = body;
        if (data.length === 0) {
            return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
        }
        const { itemPass, itemFail } = await this.commentService
            .deleteBatchComment(data, req as IReq);
        if (itemFail && itemFail.length > 0) {
            itemFail.forEach((item) => errors.push(item));
        }
        const dataRespond: IDataRespond = new Object();
        // Just respond fields have value
        if (itemPass.length > 0) dataRespond.data = itemPass;
        if (errors.length > 0) dataRespond.errors = errors;
        return new MultipleRespond(dataRespond).multipleRespond();
    }
}