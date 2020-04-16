defmodule Bread.LinkFetcher do

  @youtube_regex ~r/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  @youtube_match ~r/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/
  @metatag_regex ~r/<\s*meta\s(?=[^>]*?\bproperty\s*=\s*(?|"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=)))[^>]*?\bcontent\s*=\s*(?|"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=))[^>]*>/
  @title_regex ~r/<title>(.*)<\/title>/
  alias Bread.OpenGraph

  def fetch link do
    uri = URI.parse(link)
    domain = if uri.host, do: String.replace(uri.host, "www.", ""), else: ""
    cond do
      (domain == "youtube.com" or domain == "youtu.be" or domain == "m.youtube.com") -> 
        id = Enum.at(Regex.run(@youtube_regex, link), 7)
        fetch_generic("https://www.youtube.com/watch?v=" <> id)
      true ->
        fetch_generic(link)
    end 
  end

  def fetch_youtube link do
    id = Enum.at(Regex.run(@youtube_regex, link), 7)
    case HTTPoison.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" <> id) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        IO.inspect(body)
      other -> IO.inspect(other)
    end
  end

  def fetch_generic link do
    case HTTPoison.get(link, [], ssl: [{:versions, [:"tlsv1.2"]}], follow_redirect: true, max_body_length: 1_000_000) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        parsed = if String.valid?(body), do: parse(body), else: struct(OpenGraph, %{})
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
    end
  end

  defstruct [:title, :type, :image, :url, :description, :site_name]
  def parse(html) do
    case Floki.parse_document(html) do
      {:ok, document} ->
        meta_info = document
          |> Floki.find("meta[property^='og:']")
          |> Enum.map(fn elem ->
            ["og:" <> property] = Floki.attribute(elem, "property")
            [content] = Floki.attribute(elem, "content")
            {String.to_atom(property), content}
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