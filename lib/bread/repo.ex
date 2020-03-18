defmodule Bread.Repo do
  use Ecto.Repo,
    otp_app: :bread,
    adapter: Ecto.Adapters.Postgres
end
