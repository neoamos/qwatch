defmodule Bread.Rooms.Links do
  import Ecto.Query, warn: false
  alias Bread.Repo

  alias Bread.Rooms.Room
  alias Bread.Rooms.Link

  def delete_link({:id, id}) do
    from(l in Link, where: l.id == ^id) 
    |> Repo.delete_all
  end

end