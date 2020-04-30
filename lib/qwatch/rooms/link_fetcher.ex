defmodule Qwatch.LinkFetcher do

  @youtube_regex ~r/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  @youtube_match ~r/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/
  @metatag_regex ~r/<\s*meta\s(?=[^>]*?\bproperty\s*=\s*(?|"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=)))[^>]*?\bcontent\s*=\s*(?|"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=))[^>]*>/
  @title_regex ~r/<title>(.*)<\/title>/
  alias Qwatch.OpenGraph

  def fetch link do
    uri = URI.parse(link)
    domain = if uri.host, do: String.replace(uri.host, "www.", ""), else: ""
    cond do
      (!uri.scheme or !uri.host) -> {:error, "Invalid link"}
      (domain == "youtube.com" or domain == "youtu.be" or domain == "m.youtube.com") and uri.query-> 
        # id = Enum.at(Regex.run(@youtube_regex, link), 7)
        # fetch_generic("https://www.youtube.com/watch?v=" <> id)
        fetch_youtube link, uri
      (domain == "mixer.com") -> 
        fetch_mixer link, uri
      true ->
        fetch_generic(link)
    end 
  end

  def fetch_mixer link, url do
    channel_name = String.slice(url.path, 1..-1)
    case HTTPoison.get("https://mixer.com/api/v1/channels/#{channel_name}/details") do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, json} ->
            map = %{
              image: (if json["thumbnail"], do: json["thumbnail"]["url"], else: json["bannerURL"]),
              title: json["token"] <> " - Mixer",
              type: "video",
              url: link,
              site_name: "Mixer"
            }
            {:ok, struct(OpenGraph, map)}
          {:error, reason} -> 
            {:error, reason}
        end
      {:ok, other} ->
        {:error, "Received bad response"}
      {:error, reason} -> 
        {:error, reason}
    end
  end

  def fetch_youtube link, url do
    query = URI.decode_query(url.query)
    oembed_target = case query["list"] do
      "PL" <> list -> "https://www.youtube.com/playlist?list=" <> query["list"]
      _ -> link
    end 
    case HTTPoison.get("http://www.youtube.com/oembed?format=json&url=" <> oembed_target) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, json} ->
            map = %{
              image: (json["thumbnail_url"] |> String.replace("hqdefault", "mqdefault")),
              title: json["title"],
              type: json["type"],
              url: link,
              site_name: "YouTube"
            }
            {:ok, struct(OpenGraph, map)}
          {:error, reason} -> 
            {:error, reason}
        end
      {:ok, other} ->
        {:error, "Received bad response"}
      {:error, reason} -> 
        {:error, reason}
    end
  end

  def fetch_generic link do
    IO.inspect(link)
    case HTTPoison.get(link, [], ssl: [{:versions, [:"tlsv1.2"]}], follow_redirect: true, max_body_length: 1_000_000) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        parsed = if String.valid?(body), do: parse_metatags(body), else: struct(OpenGraph, %{})
        url = URI.parse(link)
        parsed = if !parsed.site_name && url.host do
          Map.put(parsed, :site_name, String.replace(url.host, "www.", ""))
        else
          parsed
        end
        parsed = if !parsed.title && url.path do
          Map.put(parsed, :title, url.path)
        else
          parsed
        end
        {:ok, parsed}
      {:ok, %HTTPoison.Response{status_code: status_code} = resp} ->
        IO.inspect(resp)
        {:error, "Error from HTTPoison, status code: #{status_code}"}
      {:error, %HTTPoison.Error{reason: reason}} ->
        IO.inspect(reason)
        {:error, reason}
      other -> 
        IO.inspect(other)
        {:error, "Failed for some reason"}
    end
  end

  defstruct [:title, :type, :image, :url, :description, :site_name]
  def parse_metatags(html) do
    case Floki.parse_document(html) do
      {:ok, document} ->
        meta_info = document
          |> Floki.find("meta[property^='og:']")
          |> Enum.flat_map(fn elem ->
            ["og:" <> property] = Floki.attribute(elem, "property")
            case Floki.attribute(elem, "content") do
              [content] -> [{String.to_atom(property), content}]
              _ -> []
            end
          end)

        meta_info = struct(OpenGraph, meta_info)
        if !meta_info.title do
          title = document
            |> Floki.find("title")
            |> Floki.text()
            |> String.replace(~r/\r|\n/, "")

            Map.put(meta_info, :title, title)
        else
          meta_info
        end

      _ -> struct(OpenGraph, %{})
    end

  end

  defp filter_og_metatags(["og:" <> _property, _content]), do: true
  defp filter_og_metatags(_), do: false

  defp drop_og_prefix(["og:" <> property, content]) do
    [property, content]
  end
end