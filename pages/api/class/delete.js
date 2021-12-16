import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getCBI: 'getClassById',
  delClass: 'delClassById',
};
const baseUrl = 'sqls/class/delete'; // 끝에 슬래시 붙이지 마시오.

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  // #3. 작업
  setBaseURL('sqls/class/delete'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.class.check.3',
      message: 'server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.0. 사용자 토큰을 이용해 유효성을 검증하고, 필요하면 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  const userId = qUserId.message;

  // #3.1.
  const { class_id: classId, member_id: memberId } = req.body;

  // #3.2.  class의 존재 유무 체크
  const qClass = await QTS.getCBI.fQuery(baseUrl, { classId });
  if (qClass.type === 'error')
    return qClass.onError(res, '3.2', 'searching class');

  // #3.2.1. 반이 존재하지 않을 때
  if (qClass.message.rows.length === 0)
    return ERROR(res, {
      code: 203,
      id: 'ERR.class.update.3.2.1',
      message: '해당하는 데이터가 존재하지 않습니다.',
    });

  const classSchoolId = qClass.message.rows[0].school_id;

  // #3.3.
  const qMember = await POST(
    'school',
    '/checkMember',
    { 'Content-Type': 'application/json' },
    { userId, memberId },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.3', 'fatal error while searching member');

  // #3.4.
  const { schoolId, grade, classId: memberClassId } = qMember.message;

  // #3.5. 권한 조회
  // #3.5.1. 원 정보의 일치성 점검(권한에 상관없이 원 정보가 일치해야 한다)
  if (schoolId !== classSchoolId)
    return ERROR(res, {
      code: 401,
      id: 'ERR.class.update.3.5.1',
      message: '해당하는 반의 정보에 대한 수정권한이 없습니다.',
    });

  // #3.5.2. 반 정보 수정 권한 점검
  if (grade > 3)
    // grade: 1 - 원장, 2 - 부원장, 3 - 선생님
    return ERROR(res, {
      code: 401,
      id: 'ERR.class.update.3.5.2',
      message: '해당하는 반의 정보에 대한 수정권한이 없습니다.',
    });

  // #3.5.3. 반 정보의 일치성 점검
  if (grade === 3 && classId !== memberClassId)
    return ERROR(res, {
      code: 401,
      id: 'ERR.class.update.3.5.3',
      message: '해당하는 반의 정보에 대한 수정권한이 없습니다.',
    });

  // #3.6. 반 정보 수정
  const qDel = await QTS.delClass.fQuery(baseUrl, { classId });
  if (qDel.type === 'error') return qDel.onError(res, '3.6', 'deleting class');

  return RESPOND(res, {
    message: '해당하는 데이터를 성공적으로 삭제하였습니다.',
    resultCode: 200,
  });
}
