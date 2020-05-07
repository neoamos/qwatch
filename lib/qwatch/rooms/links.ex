defmodule Qwatch.Rooms.Links do
  import Ecto.Query, warn: false
  alias Qwatch.Repo

  alias Qwatch.Rooms.Room
  alias Qwatch.Rooms.RoomServer
  alias Qwatch.Rooms.Link
  alias Qwatch.Rooms.Links
  alias Qwatch.LinkFetcher

  def delete_link({:id, id}) do
    from(l in Link, where: l.id == ^id) 
    |> Repo.delete_all
  end

  def update_link link_id, attrs do
    link = Links.get_link({:id, link_id})
    if link do
      link
      |> Link.edit_changeset(attrs)
      |> Repo.update()
    else
      {:error, "Link does not exist"}
    end
  end

  def get_link {:id, id}, params \\ %{} do
    query = from l in Link, where: l.id==^id

    query = if params[:preload] do
      from l in query, preload: ^params[:preload]
    else
      query
    end

    Repo.one(query)
  end

  def get_links {:list, id_list}, params \\ %{} do
    query = from l in Link, where: l.id in ^id_list

    query = if params[:preload] do
      from l in query, preload: ^params[:preload]
    else
      query
    end

    Repo.all(query)
  end


  def get_link_info link_id do
    link = get_link({:id, link_id}, preload: [:room])
    if link do
      update = case LinkFetcher.fetch(link.link) do
        {:ok, info} -> 
          uri = URI.parse(link.link)
          external_image = (if !!info.image and String.starts_with?(info.image, "/"), do: "#{uri.scheme || "https"}://#{uri.host}#{info.image}", else: info.image)
          internal_image = if external_image do
            case download_cover(external_image) do
              {:ok, name} -> name
              _ -> nil
            end
          end
          %{
            title: (info.title |> String.slice(0..255)),
            description: info.description,
            site_name: info.site_name,
            external_image: (if !!info.image and String.starts_with?(info.image, "/"), do: "#{uri.scheme || "https"}://#{uri.host}#{info.image}", else: info.image),
            image: internal_image
          }
        {:error, message} -> 
          uri = URI.parse(link.link)
          IO.inspect(message)
          %{
            title: uri.path,
            site_name: (if uri.host, do: String.replace(uri.host, "www.", ""), else: nil)
          }
      end
      case update_link link_id, update do
        {:ok, new_link} ->
          RoomServer.update_link(link.room.name, link.id)
          {:ok, new_link}
        other -> other
      end
    else
      {:error, "Link does not exist"}
    end
  end

  def download_cover link do
    uri = URI.parse(link)
    if !uri.scheme or !uri.host do
      {:error, "Invalid link"}
    else
      with {:ok, %{status_code: 200, body: body}} <- HTTPoison.get(link, follow_redirect: true, max_body_length: 16_000_000)
      do
        IO.inspect(byte_size(body))
        img_name = (:crypto.strong_rand_bytes(10) |> Base.url_encode64 |> binary_part(0, 10)) <> ".jpg"
        File.write!("../tmp/cover/" <> img_name, body)

        config = [
          "../tmp/cover/" <> img_name,
          "-thumbnail",
          "320x180",
          "-quality",
          "80",
          "-unsharp",
          "0x.5",
          "../images/cover/" <> img_name
        ]
        System.cmd("convert", config)

        File.rm("../tmp/cover/" <> img_name)
        {:ok, img_name}
      else
        other -> 
          IO.inspect(other)
          {:error, other}
      end
    end
  end

  def download_all_covers limit \\ 100 do
    ids = Repo.all(from l in Link, limit: ^limit, select: l.id)
    IO.inspect(ids)

    Enum.map(ids, fn id ->
      get_link_info(id)
    end)
  end

end