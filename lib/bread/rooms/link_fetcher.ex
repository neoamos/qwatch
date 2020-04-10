defmodule Bread.LinkFetcher do

  @youtube_regex ~r/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  @youtube_match ~r/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/
  @metatag_regex ~r/<\s*meta\s(?=[^>]*?\bproperty\s*=\s*(?|"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=)))[^>]*?\bcontent\s*=\s*(?|"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=))[^>]*>/
  @title_regex ~r/<title>(.*)<\/title>/
  alias Bread.OpenGraph

  def fetch link do
    cond do
      Regex.match?(@youtube_regex, link) -> 
        # fetch_youtube(link)
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
    case HTTPoison.get(link, [], ssl: [{:versions, [:"tlsv1.2"]}], follow_redirect: true) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        parsed = parse(body)
        url = URI.parse(link)
        parsed = if !parsed.site_name && url.host do
          Map.put(parsed, :site_name, String.replace(url.host, "www.", ""))
        else
          parsed
        end
        {:ok, parsed}
      {:ok, %HTTPoison.Response{status_code: status_code}} ->
        {:error, "Error from HTTPoison, status code: #{status_code}"}
      {:error, %HTTPoison.Error{reason: reason}} ->
        {:error, reason}
    end
  end

  defstruct [:title, :type, :image, :url, :description, :site_name]
  def parse(html) do
    map =
      @metatag_regex
      |> Regex.scan(html, capture: :all_but_first)
      |> Enum.filter(&filter_og_metatags(&1))
      |> Enum.map(&drop_og_prefix(&1))
      |> Enum.into(%{}, fn [k, v] -> {k, v} end)
      |> Enum.map(fn {key, value} -> {String.to_atom(key), value} end)

    map = struct(OpenGraph, map)

    if !map.title do
      title = Regex.scan(@title_regex, html, capture: :all_but_first)
      if Enum.at(title, 0) do
        Map.put(map, :title, title |> Enum.at(0) |> Enum.at(0))
      else
        map
      end
    else
      map
    end

  end

  defp filter_og_metatags(["og:" <> _property, _content]), do: true
  defp filter_og_metatags(_), do: false

  defp drop_og_prefix(["og:" <> property, content]) do
    [property, content]
  end
end