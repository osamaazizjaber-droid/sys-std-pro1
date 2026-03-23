load "sockets.ring"

port = 8080
cServer = "127.0.0.1"

see "Starting SYS WMS Pro Web Server..." + nl
sock = socket(AF_INET, SOCK_STREAM, 0)
bind(sock, cServer, port)
listen(sock, 5)

see "Server running at http://" + cServer + ":" + port + nl
see "Press Ctrl+C to stop." + nl

while true
    newsock = accept(sock)
    request = recv(newsock, 2048)
    
    if len(request) > 0
        lines = str2list(request)
        if len(lines) > 0
            # Get the first line (e.g., GET /index.html HTTP/1.1)
            parts = split(lines[1], " ")
            if len(parts) >= 2
                path = parts[2]
                if path = "/" path = "/index.html" ok
                
                # Basic protection
                if substr(path, "..") > 0 
                    path = "/index.html"
                ok
                
                filepath = currentdir() + path
                # Convert slashes for Windows
                filepath = substr(filepath, "/", "\")
                
                if fexists(filepath)
                    ext = ""
                    pos = len(filepath)
                    while pos > 0 and substr(filepath, pos, 1) != "."
                        pos = pos - 1
                    end
                    if pos > 0 
                        ext = lower(substr(filepath, pos, len(filepath) - pos + 1)) 
                    ok
                    
                    type = "text/html"
                    if ext = ".css" type = "text/css" ok
                    if ext = ".js" type = "application/javascript" ok
                    if ext = ".json" type = "application/json" ok
                    if ext = ".png" type = "image/png" ok
                    
                    content = read(filepath)
                    header = "HTTP/1.1 200 OK" + nl + 
                             "Content-Type: " + type + nl + 
                             "Access-Control-Allow-Origin: *" + nl + nl
                    send(newsock, header + content)
                else
                    header = "HTTP/1.1 404 Not Found" + nl + "Content-Type: text/plain" + nl + nl
                    send(newsock, header + "404 Not Found")
                ok
            ok
        ok
    ok
    close(newsock)
end

func split str, delim
    aList = []
    cWord = ""
    for x = 1 to len(str)
        if substr(str, x, 1) = delim
            add(aList, cWord)
            cWord = ""
        else
            cWord += substr(str, x, 1)
        ok
    next
    add(aList, cWord)
    return aList
