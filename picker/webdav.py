from webdav4.client import Client

WEBDAV_URL = "http://localhost:8080"

client = Client(WEBDAV_URL)


def list_files(path: str = "/") -> list[dict]:
    """List files and directories at the given path."""
    entries = client.ls(path, detail=True)
    results = []
    for entry in entries:
        href = entry["href"]
        # Skip the directory itself
        if href.rstrip("/") == path.rstrip("/"):
            continue
        is_dir = entry["type"] == "directory"
        results.append(
            {
                "name": entry.get("display_name") or href.rstrip("/").rsplit("/", 1)[-1],
                "path": href,
                "is_dir": is_dir,
                "size": entry.get("content_length") if not is_dir else None,
                "content_type": entry.get("content_type", ""),
                "modified": str(entry["modified"]) if entry.get("modified") else "",
            }
        )
    return results
