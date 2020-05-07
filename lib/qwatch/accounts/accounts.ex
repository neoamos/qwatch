defmodule Qwatch.Accounts do
  import Ecto.Query, warn: false
  alias Qwatch.Repo
  

  alias Qwatch.Accounts.User


  def get_user(params, preloads \\ [])

  def get_user({:name, name}, preloads) do
    user = from(u in User, where: u.name == ^name, preload: ^preloads) |> Repo.one()
    case user do
      %User{} -> {:ok, user}
      nil -> {:error, :notfound}
    end
  end

  def get_user({:id, id}, preloads) do
    user = from(u in User, where: u.id == ^id, preload: ^preloads) |> Repo.one()
    case user do
      %User{} -> {:ok, user}
      nil -> {:error, :notfound}
    end
  end

end