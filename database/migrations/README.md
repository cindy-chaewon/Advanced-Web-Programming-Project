# DB Migrations

기존 데이터를 보존하면서 스키마를 변경할 때 적용하는 ALTER 모음.

## 적용 방법

```bash
sudo mysql < database/migrations/2026-05-12_phase3_fields.sql
```

또는 mapweb 유저 사용:
```bash
mysql -u mapweb -p mapweb < database/migrations/2026-05-12_phase3_fields.sql
```

## 일반 규칙

- 파일명: `YYYY-MM-DD_<짧은_설명>.sql`
- 동시에 `database/schema.sql`도 같은 변경 반영해서 다음 fresh setup이 일관되게 동작
- 이미 적용된 마이그레이션은 다시 적용하지 않도록 본인이 관리 (현재는 Alembic 같은 트래커 없음)
- 컬럼 추가 등 idempotent하지 않은 ALTER는 `IF NOT EXISTS` (MySQL 8.0+) 사용 권장
