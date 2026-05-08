## 데이터베이스 설정

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p mapweb < database/seed.sql
```
데이터는 seed.sql에 따로 관리 (입력/삭제/수정 등등)
