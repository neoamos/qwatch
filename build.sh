ver=$1
export DATABASE_URL=ecto://postgres:postgres@localhost/bread_prod
export SECRET_KEY_BASE=EHrNPw9MRj1MI6kTv7kb9N+7TYpbeTrxJNsuB3BuYJFCMRBtD55mdw2Lx0poHqqE
MIX_ENV=prod mix compile

npm run deploy --prefix ./assets
mix phx.digest

MIX_ENV=prod DATABASE_URL=ecto://postgres:postgres@localhost/bread_prod SECRET_KEY_BASE=EHrNPw9MRj1MI6kTv7kb9N+7TYpbeTrxJNsuB3BuYJFCMRBtD55mdw2Lx0poHqqE mix distillery.release
echo $ver

# ssh bread "mkdir -p /home/ubuntu/bread/releases/$ver"

# scp _build/prod/rel/bread/releases/$ver/bread.tar.gz bread:/home/ubuntu/bread/releases/$ver

scp _build/prod/rel/bread/releases/$ver/bread.tar.gz bread:/home/ubuntu/bread

