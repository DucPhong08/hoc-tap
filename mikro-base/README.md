# mikro-base

Thu muc nay chi chua tai nguyen lien quan den database, khong chua business code.

## Cau truc

- `migrations/`: migration `.js` cho MikroORM CLI
- `seeds/`: cho seeder sau nay
- `factories/`: helper tao du lieu mau cho seed/test
- `sql/`: SQL thu cong cho view, function, trigger, extension

## Nguyen tac

- Khong dat `entity`, `repository`, `service` vao day
- Entity van nam trong `src/modules/*/entities`
- Config runtime van nam trong `src/database`

## Trang thai hien tai

- `migrations`: da wired va dang dung
- `seeds`: moi la skeleton folder, chua wired command
- `factories`: skeleton folder
- `sql`: skeleton folder

## Neu muon chay seed

Can bo sung them:

- package `@mikro-orm/seeder`
- config `seeder` trong MikroORM options
- script `db:seed`
- cac seeder class trong `mikro-base/seeds`
