defmodule Qwatch.Repo.Migrations.RemoveNormalizedEmail do
  use Ecto.Migration

  def change do
    alter table(:user) do
      remove :email_normalized
    end
  end
end
