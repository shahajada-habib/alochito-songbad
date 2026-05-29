param(
    [string]$ApiBaseUrl = "http://localhost:8082",
    [string]$AdminEmail = "admin",
    [string]$AdminPassword = "1234",
    [switch]$SkipAuth,
    [switch]$DryRun,
    [switch]$ForceUpdate,
    [string]$DemoUserPassword = "DemoProfileOnly-2026!"
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd("/")
$Headers = @{ "Accept" = "application/json" }

$Summary = [ordered]@{
    Categories       = [ordered]@{ Created = 0; Updated = 0; Skipped = 0 }
    Journalists      = [ordered]@{ Created = 0; Updated = 0; Skipped = 0 }
    News             = [ordered]@{ Created = 0; Updated = 0; Skipped = 0 }
    BreakingNews     = [ordered]@{ Created = 0; Updated = 0; Skipped = 0 }
    SiteSettings     = [ordered]@{ Created = 0; Updated = 0; Skipped = 0 }
    HomepageSettings = [ordered]@{ Created = 0; Updated = 0; Skipped = 0 }
    Comments         = [ordered]@{ Created = 0; Updated = 0; Skipped = 1 }
}

function ConvertTo-BodyJson {
    param([object]$Body)
    return ($Body | ConvertTo-Json -Depth 10)
}

function Invoke-Json {
# Usage:
#   .\tools\seed-client-portal-demo-data.ps1 -ApiBaseUrl "http://localhost:8082" -AdminEmail "admin" -AdminPassword "1234"
#   Add -DryRun to preview actions, or -ForceUpdate to refresh existing demo content.
# The script seeds editable client portal demo data through existing CMS/public APIs and avoids Media Operations/ERP data.
param(
        [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")]
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [switch]$Public
    )

    $uri = if ($Path.StartsWith("http")) { $Path } else { "$ApiBaseUrl$Path" }
    $requestHeaders = @{}
    foreach ($key in $Headers.Keys) {
        $requestHeaders[$key] = $Headers[$key]
    }

    if ($DryRun -and $Method -ne "GET") {
        Write-Host "[dry-run] $Method $uri"
        return $Body
    }

    try {
        if ($null -eq $Body) {
            $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $uri -Headers $requestHeaders
        } else {
            $json = ConvertTo-BodyJson $Body
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $uri -Headers $requestHeaders -ContentType "application/json; charset=utf-8" -Body $bytes
        }

        if ($null -eq $response.RawContentStream) {
            return $null
        }

        $response.RawContentStream.Position = 0
        $reader = New-Object System.IO.StreamReader($response.RawContentStream, [System.Text.Encoding]::UTF8)
        $text = $reader.ReadToEnd()
        if ([string]::IsNullOrWhiteSpace($text)) {
            return $null
        }

        return $text | ConvertFrom-Json
    } catch {
        $message = $_.Exception.Message
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            $message = $_.ErrorDetails.Message
        } elseif ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
            $detail = $reader.ReadToEnd()
            if (-not [string]::IsNullOrWhiteSpace($detail)) {
                $message = $detail
            }
        }
        throw "API request failed: $Method $uri`n$message"
    }
}

function Test-Backend {
    try {
        Invoke-RestMethod -Method GET -Uri "$ApiBaseUrl/api/health" -TimeoutSec 8 | Out-Null
    } catch {
        throw "Backend is not reachable at $ApiBaseUrl. Start the mysql-dev backend first, then rerun this script."
    }
}

function Login-Admin {
    if ($SkipAuth) {
        Write-Host "Auth skipped by -SkipAuth. Admin endpoints must be open for this to work."
        return
    }

    $payload = @{
        username = $AdminEmail
        password = $AdminPassword
    }

    try {
        $response = Invoke-Json POST "/api/auth/login" $payload
    } catch {
        throw "Admin login failed for '$AdminEmail'. Pass -AdminEmail and -AdminPassword for your local admin user. The mysql-dev defaults are admin / 1234."
    }

    if (-not $response.token) {
        throw "Admin login succeeded but no JWT token was returned."
    }

    $Headers["Authorization"] = "Bearer $($response.token)"
}

function ConvertTo-Slug {
    param([string]$Value)
    $slug = $Value.ToLowerInvariant() -replace "[^a-z0-9]+", "-"
    $slug = $slug.Trim("-")
    if ([string]::IsNullOrWhiteSpace($slug)) {
        return "demo-" + [Math]::Abs($Value.GetHashCode())
    }
    return $slug
}

function Same-Value {
    param([object]$Left, [object]$Right)
    return ([string]$Left) -eq ([string]$Right)
}

function Get-ByProperty {
    param(
        [object[]]$Items,
        [string]$Property,
        [object]$Value
    )
    $Items = As-Array $Items
    return @($Items | Where-Object { Same-Value $_.$Property $Value } | Select-Object -First 1)[0]
}

function As-Array {
    param([object]$Value)
    if ($null -eq $Value) {
        return @()
    }

    $propertyNames = @($Value.PSObject.Properties | ForEach-Object { $_.Name })
    if (($propertyNames -contains "value") -and ($propertyNames -contains "Count")) {
        return @($Value.value)
    }

    return @($Value)
}

function Update-SiteSettings {
    $desired = [ordered]@{
        siteName      = "আলোচিত সংবাদ"
        tagline       = "সবার আগে সত্য খবর"
        logoUrl       = ""
        faviconUrl    = ""
        footerLogoUrl = ""
        contactEmail  = ""
        contactPhone  = ""
        address       = ""
        facebookUrl   = ""
        youtubeUrl    = ""
        twitterUrl    = ""
        linkedinUrl   = ""
        aboutText     = "আলোচিত সংবাদে জাতীয়, আন্তর্জাতিক, খেলাধুলা, অর্থনীতি ও নাগরিক জীবনের খবর নিরপেক্ষভাবে উপস্থাপনের নমুনা দেখানো হয়েছে।"
    }

    $current = Invoke-Json GET "/api/admin/site-settings"
    $changed = $ForceUpdate
    foreach ($key in $desired.Keys) {
        if (-not (Same-Value $current.$key $desired[$key])) {
            $changed = $true
            break
        }
    }

    if (-not $changed) {
        $Summary.SiteSettings.Skipped++
        return
    }

    Invoke-Json PUT "/api/admin/site-settings" $desired | Out-Null
    $Summary.SiteSettings.Updated++
}

function Get-OrCreateCategory {
    param(
        [object]$Category,
        [object[]]$ExistingCategories
    )

    $existing = Get-ByProperty $ExistingCategories "slug" $Category.slug
    if (-not $existing) {
        $existing = Get-ByProperty $ExistingCategories "name" $Category.name
    }

    if ($existing) {
        $needsUpdate = $ForceUpdate -or -not (Same-Value $existing.name $Category.name) -or -not (Same-Value $existing.status $Category.status)
        if ($needsUpdate) {
            $payload = @{
                name   = $Category.name
                slug   = $Category.slug
                status = $Category.status
            }
            Invoke-Json PUT "/api/categories/$($existing.id)" $payload | Out-Null
            $Summary.Categories.Updated++
        } else {
            $Summary.Categories.Skipped++
        }
        return $existing
    }

    Invoke-Json POST "/api/categories" $Category | Out-Null
    $Summary.Categories.Created++
    return $Category
}

function Get-OrCreateJournalistOrTeamMember {
    param(
        [object]$Member,
        [object[]]$ExistingUsers
    )

    $existing = Get-ByProperty $ExistingUsers "username" $Member.username
    $payload = @{
        username        = $Member.username
        password        = $DemoUserPassword
        role            = $Member.role
        status          = "active"
        displayName     = $Member.displayName
        designation     = $Member.designation
        bio             = $Member.bio
        profileImageUrl = $Member.profileImageUrl
        facebookUrl     = ""
        twitterUrl      = ""
        emailPublic     = $Member.emailPublic
        isPublic        = $true
    }

    if ($existing) {
        $needsUpdate = $ForceUpdate -or -not (Same-Value $existing.displayName $Member.displayName) -or -not (Same-Value $existing.designation $Member.designation) -or -not (Same-Value $existing.bio $Member.bio)
        if ($needsUpdate) {
            Invoke-Json PATCH "/api/admin/users/$($existing.id)/profile" $payload | Out-Null
            if (-not (Same-Value $existing.status "active")) {
                Invoke-Json PATCH "/api/admin/users/$($existing.id)/status" @{ status = "active" } | Out-Null
            }
            $Summary.Journalists.Updated++
        } else {
            $Summary.Journalists.Skipped++
        }
        return $existing
    }

    $created = Invoke-Json POST "/api/admin/users" $payload
    $Summary.Journalists.Created++
    return $created
}

function New-ArticleContent {
    param(
        [string]$Category,
        [string]$Title,
        [string]$Subtitle
    )

    $focus = switch ($Category) {
        "জাতীয়" { "নাগরিক সেবা, স্থানীয় উদ্যোগ এবং দৈনন্দিন জীবনের পরিবর্তন" }
        "রাজনীতি" { "নীতিনির্ধারণ, দলীয় কার্যক্রম এবং গণতান্ত্রিক প্রক্রিয়া" }
        "আন্তর্জাতিক" { "আঞ্চলিক সহযোগিতা, বৈশ্বিক অর্থনীতি এবং মানবিক উদ্যোগ" }
        "খেলাধুলা" { "দলীয় প্রস্তুতি, মাঠের পারফরম্যান্স এবং তরুণ খেলোয়াড়দের সম্ভাবনা" }
        "বিনোদন" { "সংস্কৃতি, চলচ্চিত্র, নাটক এবং সৃজনশীল উদ্যোগ" }
        "অর্থনীতি" { "বাজার, কর্মসংস্থান, উদ্যোক্তা এবং ভোক্তা স্বার্থ" }
        "শিক্ষা" { "শিক্ষার্থী, শিক্ষক, পাঠক্রম এবং দক্ষতা উন্নয়ন" }
        "প্রযুক্তি" { "ডিজিটাল সেবা, সাইবার নিরাপত্তা এবং উদ্ভাবন" }
        "স্বাস্থ্য" { "জনস্বাস্থ্য, সচেতনতা এবং সহজলভ্য সেবা" }
        default { "পাঠকের অভিজ্ঞতা, জনজীবন এবং প্রাসঙ্গিক বিশ্লেষণ" }
    }

    return @"
<p>$Subtitle</p>
<p>আলোচিত সংবাদ ডেস্কের এই ডেমো প্রতিবেদনে $focus নিয়ে একটি নিরপেক্ষ সংবাদ উপস্থাপন করা হয়েছে। বাস্তব প্রকাশনার আগে সম্পাদকীয় দল তথ্য যাচাই, উৎস নিশ্চিতকরণ এবং প্রাসঙ্গিক প্রেক্ষাপট যুক্ত করার কাজ করবে।</p>
<p>সম্পৃক্ত ব্যক্তিরা জানিয়েছেন, উদ্যোগটি ধাপে ধাপে বাস্তবায়ন হলে সাধারণ পাঠক ও নাগরিকদের জন্য বিষয়টি আরও সহজবোধ্য হবে। সংশ্লিষ্ট দপ্তর, প্রতিষ্ঠান বা সংগঠনের বক্তব্য যুক্ত করে পূর্ণাঙ্গ প্রতিবেদন তৈরি করা যেতে পারে।</p>
<p>বিশেষজ্ঞদের মতে, ধারাবাহিক পর্যবেক্ষণ, স্বচ্ছ তথ্যপ্রবাহ এবং স্থানীয় অভিজ্ঞতা বিবেচনায় রাখলে এ ধরনের খবর পাঠকের কাছে বেশি কার্যকর হয়। একই সঙ্গে ভুল তথ্য এড়াতে যাচাইযোগ্য নথি ও প্রত্যক্ষ সূত্র ব্যবহার করা জরুরি।</p>
<p>এই লেখা কেবল ক্লায়েন্ট ডেমোর জন্য তৈরি নমুনা কনটেন্ট। CMS থেকে শিরোনাম, ছবি, ট্যাগ, বিভাগ এবং পুরো প্রতিবেদনের ভাষা যেকোনো সময় সম্পাদনা করা যাবে।</p>
"@
}

function Get-OrCreateNews {
    param(
        [object]$Article,
        [object[]]$ExistingNews,
        [hashtable]$AuthorByUsername
    )

    $existing = Get-ByProperty $ExistingNews "slug" $Article.slug
    $author = $AuthorByUsername[$Article.authorUsername]
    $publishDate = (Get-Date).AddDays(-1 * [int]$Article.daysAgo).ToString("yyyy-MM-ddTHH:mm:ss")
    $payload = @{
        title          = $Article.title
        subtitle       = $Article.subtitle
        content        = New-ArticleContent -Category $Article.category -Title $Article.title -Subtitle $Article.subtitle
        imageUrl       = "https://picsum.photos/seed/$($Article.imageSeed)/1200/675"
        imageCaption   = "ডেমো ছবি"
        imageSource    = "Demo image placeholder"
        imageAlt       = $Article.title
        status         = "published"
        category       = $Article.category
        reporterName   = $author.username
        authorId       = $author.id
        source         = "আলোচিত সংবাদ"
        tagNames       = $Article.tags
        seoTitle       = $Article.title
        seoDescription = $Article.subtitle
        slug           = $Article.slug
        breaking       = [bool]$Article.breaking
        featured       = [bool]$Article.featured
        scheduledAt    = $null
        publishDate    = $publishDate
        viewCount      = 0
    }

    if ($existing) {
        if ($ForceUpdate) {
            $updated = Invoke-Json PUT "/api/news/$($existing.id)" $payload
            $Summary.News.Updated++
            return $updated
        }
        $Summary.News.Skipped++
        return $existing
    }

    $created = Invoke-Json POST "/api/news" $payload
    $Summary.News.Created++
    return $created
}

function SeedBreakingNews {
    param(
        [object[]]$SeedItems
    )

    $existingItems = As-Array (Invoke-Json GET "/api/breaking-news")
    foreach ($item in $SeedItems) {
        $matches = @($existingItems | Where-Object { Same-Value $_.text $item.text })
        $existing = @($matches | Select-Object -First 1)[0]
        $payload = @{
            text   = $item.text
            active = $true
        }

        if ($existing) {
            if ($matches.Count -gt 1) {
                foreach ($duplicate in @($matches | Select-Object -Skip 1)) {
                    Invoke-Json DELETE "/api/breaking-news/$($duplicate.id)" | Out-Null
                }
            }
            if ($ForceUpdate -or -not $existing.active) {
                Invoke-Json PUT "/api/breaking-news/$($existing.id)" $payload | Out-Null
                $Summary.BreakingNews.Updated++
            } else {
                $Summary.BreakingNews.Skipped++
            }
            continue
        }

        Invoke-Json POST "/api/breaking-news" $payload | Out-Null
        $Summary.BreakingNews.Created++
    }
}

function UpdateHomepageSettings {
    param([object[]]$SeededNews)

    $lead = @($SeededNews | Where-Object { $_.slug -eq "national-public-service-digital-dashboard" } | Select-Object -First 1)[0]
    $featured = @(
        @($SeededNews | Where-Object { $_.slug -eq "cricket-youth-camp-starts-in-mirpur" } | Select-Object -First 1)[0],
        @($SeededNews | Where-Object { $_.slug -eq "technology-startups-focus-on-bangla-tools" } | Select-Object -First 1)[0],
        @($SeededNews | Where-Object { $_.slug -eq "international-climate-dialogue-highlights-delta-cities" } | Select-Object -First 1)[0]
    ) | Where-Object { $_ -and $_.id }

    $payload = @{
        breakingTickerEnabled = $true
        leadStoryId           = $lead.id
        featuredStoryIds      = @($featured | ForEach-Object { $_.id })
        visibleCategorySections = @("জাতীয়", "রাজনীতি", "আন্তর্জাতিক", "খেলাধুলা", "বিনোদন")
        mostReadEnabled       = $true
        latestSectionEnabled  = $true
    }

    $current = Invoke-Json GET "/api/admin/homepage-settings"
    $currentFeatured = @($current.featuredStoryIds) -join ","
    $payloadFeatured = @($payload.featuredStoryIds) -join ","
    $currentCategories = @($current.visibleCategorySections) -join ","
    $payloadCategories = @($payload.visibleCategorySections) -join ","
    $changed = $ForceUpdate `
        -or -not (Same-Value $current.breakingTickerEnabled $payload.breakingTickerEnabled) `
        -or -not (Same-Value $current.leadStoryId $payload.leadStoryId) `
        -or -not (Same-Value $currentFeatured $payloadFeatured) `
        -or -not (Same-Value $currentCategories $payloadCategories) `
        -or -not (Same-Value $current.mostReadEnabled $payload.mostReadEnabled) `
        -or -not (Same-Value $current.latestSectionEnabled $payload.latestSectionEnabled)

    if (-not $changed) {
        $Summary.HomepageSettings.Skipped++
        return
    }

    Invoke-Json PUT "/api/admin/homepage-settings" $payload | Out-Null
    $Summary.HomepageSettings.Updated++
}

$Categories = @(
    @{ name = "জাতীয়"; slug = "national"; status = "active" },
    @{ name = "রাজনীতি"; slug = "politics"; status = "active" },
    @{ name = "আন্তর্জাতিক"; slug = "international"; status = "active" },
    @{ name = "খেলাধুলা"; slug = "sports"; status = "active" },
    @{ name = "বিনোদন"; slug = "entertainment"; status = "active" },
    @{ name = "অর্থনীতি"; slug = "economy"; status = "active" },
    @{ name = "শিক্ষা"; slug = "education"; status = "active" },
    @{ name = "প্রযুক্তি"; slug = "technology"; status = "active" },
    @{ name = "স্বাস্থ্য"; slug = "health"; status = "active" },
    @{ name = "মতামত"; slug = "opinion"; status = "active" }
)

$Journalists = @(
    @{ username = "arif-hasan"; displayName = "আরিফ হাসান"; designation = "সম্পাদক"; role = "editor"; emailPublic = "arif.hasan@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-arif/480/480"; bio = "সম্পাদকীয় পরিকল্পনা, নীতি-সংক্রান্ত প্রতিবেদন ও নিউজরুমের মান নিয়ন্ত্রণে নেতৃত্ব দেন। প্রশাসন, জনসেবা ও জনস্বার্থের খবরকে প্রেক্ষাপটসহ পাঠকের কাছে পৌঁছে দিতে কাজ করেন। তথ্য যাচাই, ভারসাম্যপূর্ণ ভাষা ও সংশোধনী নীতিকে সম্পাদকীয় প্রক্রিয়ার গুরুত্বপূর্ণ অংশ হিসেবে দেখেন।" },
    @{ username = "nusrat-jahan"; displayName = "নুসরাত জাহান"; designation = "বার্তা সম্পাদক"; role = "editor"; emailPublic = "nusrat.jahan@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-nusrat/480/480"; bio = "দিনের খবর বাছাই, শিরোনাম, প্রকাশনার সময়সূচি এবং ডেস্ক সমন্বয়ের দায়িত্বে আছেন। জাতীয় ডেস্ক, দ্রুত আপডেট ও যাচাই করা তথ্য প্রকাশে তিনি নিউজরুমের কেন্দ্রীয় সমন্বয় করেন। ব্রেকিং নিউজেও ভাষা, প্রেক্ষাপট ও পাঠযোগ্যতা ধরে রাখাকে অগ্রাধিকার দেন।" },
    @{ username = "mehedi-rahman"; displayName = "মেহেদী রহমান"; designation = "জ্যেষ্ঠ প্রতিবেদক"; role = "reporter"; emailPublic = "mehedi.rahman@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-mehedi/480/480"; bio = "অর্থনীতি, নাগরিক সেবা ও মাঠপর্যায়ের প্রতিবেদনে কাজ করেন। বাজার, উদ্যোক্তা, প্রশাসনিক সেবা ও সাধারণ মানুষের অভিজ্ঞতা মিলিয়ে ব্যাখ্যামূলক প্রতিবেদন তৈরি করেন। সংখ্যার পেছনের বাস্তব গল্প খুঁজে বের করাই তার প্রধান মনোযোগ।" },
    @{ username = "sabiha-islam"; displayName = "সাবিহা ইসলাম"; designation = "জাতীয় প্রতিবেদক"; role = "reporter"; emailPublic = "sabiha.islam@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-sabiha/480/480"; bio = "শিক্ষা, স্বাস্থ্য, নগর জীবন ও জনসেবার গল্প নিয়ে কাজ করেন। সরকারি সেবা, কমিউনিটি উদ্যোগ ও নাগরিক সমস্যার মানবিক দিক তুলে ধরতে আগ্রহী। মাঠের অভিজ্ঞতা, সংশ্লিষ্ট কর্তৃপক্ষের বক্তব্য ও ব্যবহারযোগ্য তথ্য একসঙ্গে রাখেন।" },
    @{ username = "shahriar-kabir"; displayName = "শাহরিয়ার কবির"; designation = "রাজনৈতিক প্রতিবেদক"; role = "reporter"; emailPublic = "shahriar.kabir@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-shahriar/480/480"; bio = "জাতীয় রাজনীতি, নির্বাচন, নীতি সংলাপ ও নাগরিক অংশগ্রহণ নিয়ে প্রতিবেদন করেন। দলীয় বক্তব্যের বাইরে নীতি, প্রক্রিয়া ও জনগণের ওপর প্রভাব বোঝাতে চেষ্টা করেন। সংবেদনশীল বিষয়ে ভারসাম্যপূর্ণ ভাষা ও যাচাই করা তথ্যকে অগ্রাধিকার দেন।" },
    @{ username = "tanvir-ahmed"; displayName = "তানভীর আহমেদ"; designation = "আন্তর্জাতিক ডেস্ক"; role = "reporter"; emailPublic = "tanvir.ahmed@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-tanvir/480/480"; bio = "আন্তর্জাতিক সম্পর্ক, আঞ্চলিক সহযোগিতা ও জলবায়ু আলোচনার ডেস্ক কনটেন্ট প্রস্তুত করেন। বৈশ্বিক ঘটনাপ্রবাহের স্থানীয় প্রভাব সহজ ভাষায় ব্যাখ্যা করেন। দক্ষিণ এশিয়া, বাণিজ্য ও মানবিক উদ্যোগ তার নিয়মিত কাভারেজের অংশ।" },
    @{ username = "rakibul-islam"; displayName = "রাকিবুল ইসলাম"; designation = "ক্রীড়া প্রতিবেদক"; role = "reporter"; emailPublic = "rakibul.islam@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-rakibul/480/480"; bio = "ক্রিকেট, ফুটবল ও তরুণ খেলোয়াড়দের প্রস্তুতি নিয়ে প্রতিবেদন করেন। ম্যাচ রিপোর্টের পাশাপাশি ক্রীড়া বিশ্লেষণ, ফিটনেস, প্রশিক্ষণ ও স্থানীয় প্রতিভার গল্প অনুসরণ করেন। মাঠের পারফরম্যান্সকে প্রেক্ষাপটসহ পাঠকের কাছে তুলে ধরেন।" },
    @{ username = "farhana-kabir"; displayName = "ফারহানা কবির"; designation = "বিনোদন প্রতিবেদক"; role = "reporter"; emailPublic = "farhana.kabir@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-farhana/480/480"; bio = "সংস্কৃতি, চলচ্চিত্র, নাটক, বই ও সৃজনশীল উদ্যোগ নিয়ে লিখেন। বিনোদন প্রতিবেদনে শিল্পী, দর্শক ও সাংস্কৃতিক পরিসরের পরিবর্তনকে একসঙ্গে দেখেন। নতুন নির্মাতা, স্থানীয় আয়োজন ও সৃজনশীল অর্থনীতির খবরেও তার আগ্রহ আছে।" },
    @{ username = "imran-hossain"; displayName = "ইমরান হোসেন"; designation = "ফটো সাংবাদিক"; role = "reporter"; emailPublic = "imran.hossain@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-imran/480/480"; bio = "ছবি, ভিজ্যুয়াল স্টোরিটেলিং ও মাঠের ডকুমেন্টেশনে কাজ করেন। সংবাদকে দৃশ্যমান, মানবিক ও প্রাসঙ্গিক করে তোলাই তার প্রধান মনোযোগ। জাতীয় ঘটনা, সংস্কৃতি ও জনজীবনের ভিজ্যুয়াল মুহূর্ত ধরে রাখতে তিনি কাজ করেন।" },
    @{ username = "mahmuda-akter"; displayName = "মাহমুদা আক্তার"; designation = "ডিজিটাল ডেস্ক"; role = "reporter"; emailPublic = "mahmuda.akter@example.com"; profileImageUrl = "https://picsum.photos/seed/alochito-mahmuda/480/480"; bio = "ওয়েব প্রকাশনা, সোশ্যাল কপি, লাইভ আপডেট ও পাঠক সম্পৃক্ততার কাজ সমন্বয় করেন। ডিজিটাল ডেস্ক ও যাচাই প্রক্রিয়ায় শিরোনাম, লিংক, ছবি ও প্রাসঙ্গিক তথ্য মিলিয়ে দেখেন। মোবাইল পাঠকের জন্য খবরকে পরিষ্কার ও দ্রুতপাঠ্য রাখাই তার লক্ষ্য।" }
)

$Articles = @(
    @{ category = "জাতীয়"; slug = "national-public-service-digital-dashboard"; title = "নাগরিক সেবার অগ্রগতি দেখতে চালু হলো ডিজিটাল ড্যাশবোর্ড"; subtitle = "সেবা গ্রহণের সময়, অভিযোগ ও ফলোআপ এক জায়গায় দেখার সুবিধা রাখা হয়েছে।"; authorUsername = "arif-hasan"; tags = @("বাংলাদেশ", "ঢাকা", "নাগরিক সেবা"); featured = $true; breaking = $true; daysAgo = 0; imageSeed = "national-1" },
    @{ category = "জাতীয়"; slug = "district-road-safety-awareness-week"; title = "জেলা শহরে সড়ক নিরাপত্তা সচেতনতা সপ্তাহ শুরু"; subtitle = "স্কুল, বাজার ও বাস টার্মিনাল এলাকায় সচেতনতামূলক কার্যক্রম চলবে।"; authorUsername = "sabiha-islam"; tags = @("বাংলাদেশ", "সড়ক", "ঢাকা"); featured = $false; breaking = $false; daysAgo = 1; imageSeed = "national-2" },
    @{ category = "জাতীয়"; slug = "local-government-service-fair-planned"; title = "স্থানীয় সরকার সেবা মেলা আয়োজনের প্রস্তুতি"; subtitle = "নাগরিক সনদ, জন্মনিবন্ধন ও তথ্যসেবা সহজ করতে মেলার পরিকল্পনা।"; authorUsername = "mehedi-rahman"; tags = @("বাংলাদেশ", "নাগরিক সেবা"); featured = $false; breaking = $false; daysAgo = 2; imageSeed = "national-3" },
    @{ category = "জাতীয়"; slug = "riverbank-community-training"; title = "নদীপাড়ের বাসিন্দাদের জন্য দুর্যোগ প্রস্তুতি প্রশিক্ষণ"; subtitle = "স্বেচ্ছাসেবক দল, প্রাথমিক চিকিৎসা ও নিরাপদ আশ্রয় নিয়ে হাতে-কলমে আলোচনা।"; authorUsername = "sabiha-islam"; tags = @("বাংলাদেশ", "স্বাস্থ্য", "প্রশিক্ষণ"); featured = $false; breaking = $false; daysAgo = 3; imageSeed = "national-4" },
    @{ category = "জাতীয়"; slug = "city-cleanup-volunteer-drive"; title = "শহর পরিচ্ছন্নতায় তরুণদের স্বেচ্ছাসেবী উদ্যোগ"; subtitle = "স্থানীয় ক্লাব ও শিক্ষার্থীরা পরিচ্ছন্নতা অভিযানে অংশ নিচ্ছেন।"; authorUsername = "imran-hossain"; tags = @("ঢাকা", "তরুণ", "বাংলাদেশ"); featured = $false; breaking = $false; daysAgo = 4; imageSeed = "national-5" },
    @{ category = "জাতীয়"; slug = "public-library-reading-corner"; title = "পাবলিক লাইব্রেরিতে শিশু-কিশোর পাঠ কর্নার"; subtitle = "সাপ্তাহিক গল্পপাঠ ও বই আলোচনা আয়োজনের পরিকল্পনা হয়েছে।"; authorUsername = "farhana-kabir"; tags = @("শিক্ষা", "সংস্কৃতি", "বাংলাদেশ"); featured = $false; breaking = $false; daysAgo = 5; imageSeed = "national-6" },

    @{ category = "রাজনীতি"; slug = "political-dialogue-local-governance"; title = "স্থানীয় শাসন নিয়ে নীতি সংলাপে অংশ নিলেন বিভিন্ন দলের প্রতিনিধি"; subtitle = "নাগরিক সেবা ও জবাবদিহি বাড়াতে সমন্বিত আলোচনার ওপর জোর দেওয়া হয়।"; authorUsername = "arif-hasan"; tags = @("রাজনীতি", "বাংলাদেশ", "নির্বাচন"); featured = $false; breaking = $true; daysAgo = 1; imageSeed = "politics-1" },
    @{ category = "রাজনীতি"; slug = "youth-participation-in-civic-process"; title = "নাগরিক প্রক্রিয়ায় তরুণদের অংশগ্রহণ বাড়াতে কর্মশালা"; subtitle = "গণতান্ত্রিক চর্চা, স্বেচ্ছাসেবা ও স্থানীয় সমস্যা চিহ্নিতকরণ নিয়ে আলোচনা।"; authorUsername = "nusrat-jahan"; tags = @("রাজনীতি", "তরুণ", "ঢাকা"); featured = $false; breaking = $false; daysAgo = 2; imageSeed = "politics-2" },
    @{ category = "রাজনীতি"; slug = "election-information-literacy-campaign"; title = "নির্বাচনী তথ্য যাচাইয়ে সচেতনতা কার্যক্রম"; subtitle = "ভুয়া তথ্য শনাক্ত, উৎস যাচাই এবং দায়িত্বশীল প্রচার নিয়ে প্রশিক্ষণ।"; authorUsername = "arif-hasan"; tags = @("নির্বাচন", "বাংলাদেশ", "তথ্য যাচাই"); featured = $false; breaking = $false; daysAgo = 4; imageSeed = "politics-3" },
    @{ category = "রাজনীতি"; slug = "policy-research-for-public-services"; title = "জনসেবা উন্নয়নে নীতি গবেষণার প্রস্তাব"; subtitle = "পরিসংখ্যান, নাগরিক মতামত ও স্থানীয় অভিজ্ঞতা ভিত্তিক সুপারিশ তৈরির কথা বলা হয়েছে।"; authorUsername = "mehedi-rahman"; tags = @("রাজনীতি", "নাগরিক সেবা"); featured = $false; breaking = $false; daysAgo = 6; imageSeed = "politics-4" },

    @{ category = "আন্তর্জাতিক"; slug = "international-climate-dialogue-highlights-delta-cities"; title = "জলবায়ু সংলাপে ডেল্টা শহরগুলোর অভিজ্ঞতা গুরুত্ব পেল"; subtitle = "নদী, নগরায়ণ ও অভিযোজন পরিকল্পনা নিয়ে আঞ্চলিক সহযোগিতার কথা উঠে আসে।"; authorUsername = "tanvir-ahmed"; tags = @("আন্তর্জাতিক", "জলবায়ু", "বাংলাদেশ"); featured = $true; breaking = $false; daysAgo = 1; imageSeed = "international-1" },
    @{ category = "আন্তর্জাতিক"; slug = "regional-trade-meet-focuses-small-business"; title = "আঞ্চলিক বাণিজ্য বৈঠকে ক্ষুদ্র উদ্যোক্তাদের সুযোগ নিয়ে আলোচনা"; subtitle = "ডিজিটাল পেমেন্ট, লজিস্টিকস ও বাজার সংযোগ সহজ করার প্রস্তাব এসেছে।"; authorUsername = "tanvir-ahmed"; tags = @("আন্তর্জাতিক", "অর্থনীতি"); featured = $false; breaking = $false; daysAgo = 2; imageSeed = "international-2" },
    @{ category = "আন্তর্জাতিক"; slug = "education-exchange-program-for-students"; title = "শিক্ষার্থী বিনিময় কর্মসূচিতে নতুন আবেদন আহ্বান"; subtitle = "ভাষা, প্রযুক্তি ও গবেষণা অভিজ্ঞতা বিনিময়ের সুযোগ থাকবে।"; authorUsername = "sabiha-islam"; tags = @("আন্তর্জাতিক", "শিক্ষা"); featured = $false; breaking = $false; daysAgo = 3; imageSeed = "international-3" },
    @{ category = "আন্তর্জাতিক"; slug = "health-cooperation-for-primary-care"; title = "প্রাথমিক স্বাস্থ্যসেবায় সহযোগিতা বাড়াতে যৌথ উদ্যোগ"; subtitle = "টিকা, মাতৃস্বাস্থ্য ও তথ্যব্যবস্থাপনা নিয়ে অভিজ্ঞতা বিনিময় হবে।"; authorUsername = "tanvir-ahmed"; tags = @("আন্তর্জাতিক", "স্বাস্থ্য"); featured = $false; breaking = $false; daysAgo = 5; imageSeed = "international-4" },
    @{ category = "আন্তর্জাতিক"; slug = "culture-festival-connects-south-asian-artists"; title = "সংস্কৃতি উৎসবে দক্ষিণ এশীয় শিল্পীদের মিলনমেলা"; subtitle = "সঙ্গীত, চলচ্চিত্র ও লোকশিল্পের প্রদর্শনীতে তরুণ শিল্পীরাও অংশ নিচ্ছেন।"; authorUsername = "farhana-kabir"; tags = @("আন্তর্জাতিক", "সংস্কৃতি"); featured = $false; breaking = $false; daysAgo = 7; imageSeed = "international-5" },

    @{ category = "খেলাধুলা"; slug = "cricket-youth-camp-starts-in-mirpur"; title = "মিরপুরে তরুণ ক্রিকেটারদের দক্ষতা উন্নয়ন ক্যাম্প শুরু"; subtitle = "ব্যাটিং, বোলিং, ফিটনেস ও মানসিক প্রস্তুতি নিয়ে আলাদা সেশন রাখা হয়েছে।"; authorUsername = "rakibul-islam"; tags = @("ক্রিকেট", "খেলাধুলা", "ঢাকা"); featured = $true; breaking = $true; daysAgo = 0; imageSeed = "sports-1" },
    @{ category = "খেলাধুলা"; slug = "school-football-final-draws-crowd"; title = "স্কুল ফুটবল ফাইনালে দর্শকের ভিড়"; subtitle = "স্থানীয় মাঠে প্রতিদ্বন্দ্বিতাপূর্ণ ম্যাচে তরুণ খেলোয়াড়দের পারফরম্যান্স নজর কাড়ে।"; authorUsername = "rakibul-islam"; tags = @("ফুটবল", "খেলাধুলা"); featured = $false; breaking = $false; daysAgo = 2; imageSeed = "sports-2" },
    @{ category = "খেলাধুলা"; slug = "women-athletes-training-support"; title = "নারী অ্যাথলেটদের প্রশিক্ষণ সহায়তা বাড়ানোর উদ্যোগ"; subtitle = "কোচিং, পুষ্টি ও নিরাপদ অনুশীলন পরিবেশ নিয়ে পরিকল্পনা চলছে।"; authorUsername = "rakibul-islam"; tags = @("খেলাধুলা", "নারী"); featured = $false; breaking = $false; daysAgo = 3; imageSeed = "sports-3" },
    @{ category = "খেলাধুলা"; slug = "local-chess-league-registration-open"; title = "স্থানীয় দাবা লিগের নিবন্ধন শুরু"; subtitle = "শিক্ষার্থী ও উন্মুক্ত দুই বিভাগে প্রতিযোগিতা আয়োজন করা হবে।"; authorUsername = "sabiha-islam"; tags = @("খেলাধুলা", "শিক্ষা"); featured = $false; breaking = $false; daysAgo = 4; imageSeed = "sports-4" },
    @{ category = "খেলাধুলা"; slug = "cricket-fitness-test-new-guidelines"; title = "ক্রিকেট ফিটনেস টেস্টে নতুন নির্দেশনা"; subtitle = "চোট প্রতিরোধ, পুনর্বাসন ও ম্যাচ প্রস্তুতিকে বেশি গুরুত্ব দেওয়া হচ্ছে।"; authorUsername = "rakibul-islam"; tags = @("ক্রিকেট", "স্বাস্থ্য", "খেলাধুলা"); featured = $false; breaking = $false; daysAgo = 6; imageSeed = "sports-5" },

    @{ category = "বিনোদন"; slug = "new-theatre-workshop-for-young-artists"; title = "তরুণ শিল্পীদের জন্য নাট্য কর্মশালা"; subtitle = "অভিনয়, মঞ্চভাষা ও গল্প নির্মাণের ওপর হাতে-কলমে প্রশিক্ষণ।"; authorUsername = "farhana-kabir"; tags = @("বিনোদন", "সংস্কৃতি"); featured = $false; breaking = $false; daysAgo = 1; imageSeed = "entertainment-1" },
    @{ category = "বিনোদন"; slug = "independent-film-screening-week"; title = "স্বাধীন চলচ্চিত্র প্রদর্শনী সপ্তাহ শুরু"; subtitle = "নতুন নির্মাতাদের কাজ দর্শকের কাছে পৌঁছে দিতে আয়োজকদের উদ্যোগ।"; authorUsername = "farhana-kabir"; tags = @("বিনোদন", "সংস্কৃতি"); featured = $false; breaking = $false; daysAgo = 3; imageSeed = "entertainment-2" },
    @{ category = "বিনোদন"; slug = "music-school-children-recital"; title = "সঙ্গীত বিদ্যালয়ের শিশুদের বার্ষিক পরিবেশনা"; subtitle = "লোকগান, আধুনিক গান ও বাদ্যযন্ত্র পরিবেশনায় অংশ নেয় শিক্ষার্থীরা।"; authorUsername = "farhana-kabir"; tags = @("সংস্কৃতি", "শিক্ষা"); featured = $false; breaking = $false; daysAgo = 5; imageSeed = "entertainment-3" },
    @{ category = "বিনোদন"; slug = "book-fair-cultural-evening"; title = "বইমেলায় সাহিত্য ও সংস্কৃতি সন্ধ্যা"; subtitle = "লেখক আলোচনা, কবিতা পাঠ ও সঙ্গীত পরিবেশনায় মুখর ছিল মেলা প্রাঙ্গণ।"; authorUsername = "imran-hossain"; tags = @("সংস্কৃতি", "বিনোদন"); featured = $false; breaking = $false; daysAgo = 7; imageSeed = "entertainment-4" },

    @{ category = "অর্থনীতি"; slug = "small-business-digital-payment-growth"; title = "ক্ষুদ্র ব্যবসায় ডিজিটাল পেমেন্ট ব্যবহারে আগ্রহ বাড়ছে"; subtitle = "দোকানদার ও ক্রেতাদের সুবিধা বিবেচনায় সহজ লেনদেনের চাহিদা বেড়েছে।"; authorUsername = "mehedi-rahman"; tags = @("অর্থনীতি", "প্রযুক্তি", "বাংলাদেশ"); featured = $false; breaking = $false; daysAgo = 1; imageSeed = "economy-1" },
    @{ category = "অর্থনীতি"; slug = "market-monitoring-consumer-awareness"; title = "বাজার তদারকির পাশাপাশি ভোক্তা সচেতনতায় জোর"; subtitle = "মূল্যতালিকা, পণ্যের মান ও অভিযোগ ব্যবস্থাকে সহজ করার কথা বলা হয়েছে।"; authorUsername = "mehedi-rahman"; tags = @("অর্থনীতি", "বাংলাদেশ"); featured = $false; breaking = $false; daysAgo = 2; imageSeed = "economy-2" },
    @{ category = "অর্থনীতি"; slug = "women-entrepreneurs-online-training"; title = "নারী উদ্যোক্তাদের অনলাইন ব্যবসা প্রশিক্ষণ"; subtitle = "পণ্য উপস্থাপন, গ্রাহক সেবা ও হিসাব ব্যবস্থাপনা নিয়ে সেশন হয়েছে।"; authorUsername = "sabiha-islam"; tags = @("অর্থনীতি", "প্রযুক্তি", "নারী"); featured = $false; breaking = $false; daysAgo = 4; imageSeed = "economy-3" },
    @{ category = "অর্থনীতি"; slug = "agri-supply-chain-cold-storage-plan"; title = "কৃষিপণ্য সরবরাহে কোল্ড স্টোরেজ পরিকল্পনা"; subtitle = "ক্ষতি কমাতে উৎপাদক, পরিবহন ও বাজার সংযোগে নতুন মডেল বিবেচনায়।"; authorUsername = "mehedi-rahman"; tags = @("অর্থনীতি", "বাংলাদেশ"); featured = $false; breaking = $false; daysAgo = 6; imageSeed = "economy-4" },

    @{ category = "শিক্ষা"; slug = "education-digital-classroom-pilot"; title = "ডিজিটাল ক্লাসরুম পাইলটে শিক্ষকদের প্রশিক্ষণ"; subtitle = "কনটেন্ট তৈরি, মূল্যায়ন ও শিক্ষার্থী অংশগ্রহণ বাড়াতে নির্দেশনা দেওয়া হয়েছে।"; authorUsername = "sabiha-islam"; tags = @("শিক্ষা", "প্রযুক্তি"); featured = $false; breaking = $false; daysAgo = 1; imageSeed = "education-1" },
    @{ category = "শিক্ষা"; slug = "library-reading-habit-campaign"; title = "পড়ার অভ্যাস বাড়াতে লাইব্রেরি ক্যাম্পেইন"; subtitle = "স্কুলভিত্তিক বই আলোচনা ও পাঠচক্র চালুর উদ্যোগ নেওয়া হয়েছে।"; authorUsername = "farhana-kabir"; tags = @("শিক্ষা", "সংস্কৃতি"); featured = $false; breaking = $false; daysAgo = 3; imageSeed = "education-2" },
    @{ category = "শিক্ষা"; slug = "skills-training-for-college-students"; title = "কলেজ শিক্ষার্থীদের জন্য দক্ষতা উন্নয়ন প্রশিক্ষণ"; subtitle = "যোগাযোগ, দলীয় কাজ ও ডিজিটাল টুল ব্যবহারের ওপর সেশন।"; authorUsername = "sabiha-islam"; tags = @("শিক্ষা", "তরুণ"); featured = $false; breaking = $false; daysAgo = 5; imageSeed = "education-3" },

    @{ category = "প্রযুক্তি"; slug = "technology-startups-focus-on-bangla-tools"; title = "বাংলা ভাষাভিত্তিক টুল তৈরিতে স্টার্টআপদের আগ্রহ"; subtitle = "কনটেন্ট, শিক্ষা ও গ্রাহক সেবায় স্থানীয় ভাষার ব্যবহার বাড়ছে।"; authorUsername = "mehedi-rahman"; tags = @("প্রযুক্তি", "বাংলাদেশ", "শিক্ষা"); featured = $true; breaking = $false; daysAgo = 1; imageSeed = "technology-1" },
    @{ category = "প্রযুক্তি"; slug = "cyber-safety-workshop-for-families"; title = "পরিবারের জন্য সাইবার নিরাপত্তা কর্মশালা"; subtitle = "শিশুদের অনলাইন নিরাপত্তা, পাসওয়ার্ড ও গোপনীয়তা নিয়ে আলোচনা।"; authorUsername = "sabiha-islam"; tags = @("প্রযুক্তি", "স্বাস্থ্য", "শিক্ষা"); featured = $false; breaking = $false; daysAgo = 3; imageSeed = "technology-2" },
    @{ category = "প্রযুক্তি"; slug = "public-wifi-service-user-guideline"; title = "পাবলিক ওয়াই-ফাই ব্যবহারে নিরাপত্তা নির্দেশিকা"; subtitle = "ব্যক্তিগত তথ্য সুরক্ষা ও নিরাপদ ব্রাউজিংয়ের ওপর জোর দেওয়া হয়েছে।"; authorUsername = "mehedi-rahman"; tags = @("প্রযুক্তি", "ঢাকা"); featured = $false; breaking = $false; daysAgo = 5; imageSeed = "technology-3" },

    @{ category = "স্বাস্থ্য"; slug = "health-awareness-seasonal-fever"; title = "ঋতু পরিবর্তনে জ্বর-সর্দি প্রতিরোধে সচেতনতা"; subtitle = "পরিষ্কার-পরিচ্ছন্নতা, বিশ্রাম ও প্রয়োজনে চিকিৎসকের পরামর্শের কথা বলা হয়েছে।"; authorUsername = "sabiha-islam"; tags = @("স্বাস্থ্য", "বাংলাদেশ"); featured = $false; breaking = $false; daysAgo = 1; imageSeed = "health-1" },
    @{ category = "স্বাস্থ্য"; slug = "community-clinic-maternal-care-session"; title = "কমিউনিটি ক্লিনিকে মাতৃস্বাস্থ্য সেবা সেশন"; subtitle = "নিয়মিত পরীক্ষা, পুষ্টি ও জরুরি লক্ষণ চেনার বিষয়ে আলোচনা।"; authorUsername = "sabiha-islam"; tags = @("স্বাস্থ্য", "নারী"); featured = $false; breaking = $false; daysAgo = 3; imageSeed = "health-2" },
    @{ category = "স্বাস্থ্য"; slug = "mental-wellbeing-student-counselling"; title = "শিক্ষার্থীদের মানসিক সুস্থতায় কাউন্সেলিং সহায়তা"; subtitle = "পরীক্ষা, চাপ ও অনলাইন ব্যবহারের ভারসাম্য নিয়ে বিশেষজ্ঞদের পরামর্শ।"; authorUsername = "sabiha-islam"; tags = @("স্বাস্থ্য", "শিক্ষা", "তরুণ"); featured = $false; breaking = $false; daysAgo = 6; imageSeed = "health-3" },

    @{ category = "মতামত"; slug = "opinion-local-newsroom-trust"; title = "স্থানীয় সংবাদমাধ্যমে আস্থা তৈরির পথ"; subtitle = "স্বচ্ছ সংশোধনী নীতি, উৎস যাচাই ও পাঠকের সঙ্গে সংলাপ আস্থা বাড়াতে পারে।"; authorUsername = "arif-hasan"; tags = @("মতামত", "বাংলাদেশ", "সংবাদমাধ্যম"); featured = $false; breaking = $false; daysAgo = 2; imageSeed = "opinion-1" },
    @{ category = "মতামত"; slug = "opinion-digital-literacy-everyday-life"; title = "দৈনন্দিন জীবনে ডিজিটাল সাক্ষরতা কেন জরুরি"; subtitle = "সেবা গ্রহণ, তথ্য যাচাই ও নিরাপদ যোগাযোগে ডিজিটাল দক্ষতার গুরুত্ব বাড়ছে।"; authorUsername = "nusrat-jahan"; tags = @("মতামত", "প্রযুক্তি", "শিক্ষা"); featured = $false; breaking = $false; daysAgo = 5; imageSeed = "opinion-2" }
)

try {
    if ($DryRun) {
        Write-Host "Dry run enabled. No API requests were sent."
        Write-Host ("Planned categories: {0}" -f $Categories.Count)
        Write-Host ("Planned journalists/team members: {0}" -f $Journalists.Count)
        Write-Host ("Planned news articles: {0}" -f $Articles.Count)
        Write-Host "Planned breaking news: 6"
        Write-Host "Planned settings updates: site settings and homepage settings"
        exit 0
    }

    Test-Backend
    Login-Admin

    Update-SiteSettings

    $existingCategories = As-Array (Invoke-Json GET "/api/categories")
    foreach ($category in $Categories) {
        Get-OrCreateCategory -Category $category -ExistingCategories $existingCategories | Out-Null
    }

    $existingUsers = As-Array (Invoke-Json GET "/api/admin/users")
    $SeededUsers = @()
    foreach ($member in $Journalists) {
        $SeededUsers += Get-OrCreateJournalistOrTeamMember -Member $member -ExistingUsers $existingUsers
    }

    $authorByUsername = @{}
    foreach ($user in $SeededUsers) {
        if ($user.username) {
            $authorByUsername[$user.username] = $user
        }
    }

    $existingNews = As-Array (Invoke-Json GET "/api/news")
    $SeededNews = @()
    foreach ($article in $Articles) {
        $SeededNews += Get-OrCreateNews -Article $article -ExistingNews $existingNews -AuthorByUsername $authorByUsername
    }

    $breakingItems = @(
        @{ text = "নাগরিক সেবার অগ্রগতি দেখতে চালু হলো ডিজিটাল ড্যাশবোর্ড" },
        @{ text = "মিরপুরে তরুণ ক্রিকেটারদের দক্ষতা উন্নয়ন ক্যাম্প শুরু" },
        @{ text = "স্থানীয় শাসন নিয়ে নীতি সংলাপে অংশ নিলেন বিভিন্ন দলের প্রতিনিধি" },
        @{ text = "ডিজিটাল ক্লাসরুম পাইলটে শিক্ষকদের প্রশিক্ষণ" },
        @{ text = "ঋতু পরিবর্তনে জ্বর-সর্দি প্রতিরোধে সচেতনতা" },
        @{ text = "বাংলা ভাষাভিত্তিক টুল তৈরিতে স্টার্টআপদের আগ্রহ" }
    )
    SeedBreakingNews -SeedItems $breakingItems

    UpdateHomepageSettings -SeededNews $SeededNews

    Write-Host ""
    Write-Host "Client portal demo seed summary"
    Write-Host "================================"
    foreach ($section in $Summary.Keys) {
        $row = $Summary[$section]
        Write-Host ("{0,-18} created: {1,2}  updated: {2,2}  skipped: {3,2}" -f $section, $row.Created, $row.Updated, $row.Skipped)
    }
    Write-Host ""
    Write-Host "Comments/reactions/view-count seeding was intentionally skipped; the existing public/admin APIs are better used manually for that demo layer."
} catch {
    Write-Error $_
    exit 1
}
