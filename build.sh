ver=$1
export DATABASE_URL=ecto://postgres:v0YpzlFFv2T5QTSRCXth@qwatch-database-1.ctqlqxpmfxb8.us-east-1.rds.amazonaws.com:5432/qwatch_prod?sslmode=require
export SECRET_KEY_BASE=0qbQ836iwUPjxz8tpsUsLwnYXGRL2VVGcoXjWOzH3Q+RvbTPFO9WN0n3ISCjskcw
export EMAIL_PASSWORD=1qNUotHGfSeHBjkX41vR
MIX_ENV=prod mix compile

npm run deploy --prefix ./assets
mix phx.digest


# MIX_ENV=prod DATABASE_URL=ecto://postgres:postgres@localhost/qwatch_prod SECRET_KEY_BASE=EHrNPw9MRj1MI6kTv7kb9N+7TYpbeTrxJNsuB3BuYJFCMRBtD55mdw2Lx0poHqqE mix distillery.release
# MIX_ENV=prod DATABASE_URL=ecto://doadmin:uy1eloq21kadbfuy@private-db-postgresql-nyc1-53294-do-user-1001672-0.a.db.ondigitalocean.com:25060/qwatch_prod?sslmode=require SECRET_KEY_BASE=EHrNPw9MRj1MI6kTv7kb9N+7TYpbeTrxJNsuB3BuYJFCMRBtD55mdw2Lx0poHqqE mix distillery.release
MIX_ENV=prod mix distillery.release
echo $ver

# ssh qwatch "mkdir -p /home/ubuntu/qwatch/releases/$ver"

# scp _build/prod/rel/qwatch/releases/$ver/qwatch.tar.gz qwatch:/home/ubuntu/qwatch/releases/$ver

scp _build/prod/rel/qwatch/releases/$ver/qwatch.tar.gz qwatch:~/qwatch

