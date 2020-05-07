defmodule Qwatch.Repo do
  use Ecto.Repo,
    otp_app: :qwatch,
    adapter: Ecto.Adapters.Postgres
end
