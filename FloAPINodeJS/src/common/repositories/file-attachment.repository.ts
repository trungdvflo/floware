import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { COLLECTION_TYPE } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { FileAttachment } from '../entities/file-attachment.entity';
import { ShareMember } from '../entities/share-member.entity';

@Injectable()
@CustomRepository(FileAttachment)
export class FileAttachmentRepository extends Repository<FileAttachment> {
  async findShareMembers(file: FileAttachment): Promise<ShareMember[]> {
    return this.manager.query(`
    SELECT csm.*
    FROM collection_shared_member csm
    INNER JOIN collection c ON c.id = csm.collection_id AND c.type = ?
    INNER JOIN linked_collection_object l ON l.collection_id = c.id
    WHERE l.object_uid = ? AND l.object_type = ?
    `, [COLLECTION_TYPE.SHARE_COLLECTION, file.object_uid, file.object_type]);
  }
}
