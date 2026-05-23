# ALOCHITO SONGBAD - Journalist profile and related news demo data seeder
#
# Usage:
# 1. Start the backend.
# 2. Run from the project root:
#    powershell -ExecutionPolicy Bypass -File tools/seed-journalist-demo-data.ps1
# 3. Refresh:
#    /journalists
#    /journalist/mahir-hasan
#    /admin/news
#
# Notes for editing:
# - Journalist payload fields match backend UserRequestDto exactly.
# - News payload fields match backend NewsRequestDto fields used by POST /api/news.
# - The script stores returned or reused journalist IDs and sends them as authorId.
# - reporterName is also set to the journalist username so public profile relation works by either path.
# - It never deletes existing data and skips duplicates by username and news slug.

$BASE_URL = "http://localhost:8082"
$ADMIN_EMAIL = "admin"
$ADMIN_PASSWORD = "1234"
$DEMO_USER_PASSWORD = "Demo@12345"

$ErrorActionPreference = "Stop"

function Convert-ToJsonBody {
    param([hashtable]$Payload)
    return ($Payload | ConvertTo-Json -Depth 20)
}

function Invoke-DemoApi {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null,
        [switch]$Anonymous
    )

    $uri = "$BASE_URL$Path"
    try {
        $headers = @{}
        if (-not $Anonymous) {
            $headers = $script:AuthHeaders
        }

        if ($Body) {
            return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json; charset=utf-8" -Body (Convert-ToJsonBody $Body)
        }

        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
    }
    catch {
        Write-Warning "API $Method $Path failed: $($_.Exception.Message)"
        return $null
    }
}

function Get-PropertyValue {
    param(
        [object]$Item,
        [string[]]$Names
    )

    if ($null -eq $Item) {
        return $null
    }

    foreach ($name in $Names) {
        $property = $Item.PSObject.Properties[$name]
        if ($property -and $null -ne $property.Value) {
            return $property.Value
        }
    }

    return $null
}

function Get-ApiList {
    param([string]$Path)

    $result = Invoke-DemoApi -Method "GET" -Path $Path
    if ($null -eq $result) {
        return @()
    }

    $isArray = $result -is [System.Array]
    $hasPagedContent = -not $isArray -and $result.PSObject.Properties["content"] -and (
        $result.PSObject.Properties["totalElements"] -or
        $result.PSObject.Properties["totalPages"] -or
        $result.PSObject.Properties["page"]
    )

    if ($hasPagedContent) {
        return @($result.content)
    }

    return @($result)
}

function Normalize-Text {
    param([string]$Value)

    if (-not $Value) {
        return ""
    }

    return $Value.Trim().ToLowerInvariant()
}

function Find-CategoryByAliases {
    param(
        [array]$Categories,
        [array]$Aliases
    )

    foreach ($alias in $Aliases) {
        $normalizedAlias = Normalize-Text $alias
        $found = $Categories | Where-Object {
            (Normalize-Text (Get-PropertyValue $_ @("slug", "key", "code"))) -eq $normalizedAlias -or
            (Normalize-Text (Get-PropertyValue $_ @("name", "title", "displayName", "label"))) -eq $normalizedAlias
        } | Select-Object -First 1

        if ($found) {
            return $found
        }
    }

    return $null
}

function Get-FallbackCategory {
    param([array]$Categories)

    $active = $Categories | Where-Object {
        $status = Get-PropertyValue $_ @("status")
        -not $status -or (Normalize-Text $status) -eq "active"
    } | Select-Object -First 1
    if ($active) {
        return $active
    }

    return $Categories | Select-Object -First 1
}

function DateTimeValue {
    param(
        [int]$DaysFromToday,
        [int]$Hour = 10,
        [int]$Minute = 0
    )

    return (Get-Date).Date.AddDays($DaysFromToday).AddHours($Hour).AddMinutes($Minute).ToString("yyyy-MM-ddTHH:mm:ss")
}

function New-NewsImageUrl {
    param(
        [string]$Category,
        [string]$Slug
    )

    $seedCategory = if ($Category) { $Category } else { "general" }
    $seedSlug = if ($Slug) { $Slug } else { [guid]::NewGuid().ToString("N") }
    return "https://picsum.photos/seed/alochito-$seedCategory-$seedSlug/1200/675"
}

function Has-UsableImageUrl {
    param([string]$Url)

    if (-not $Url) {
        return $false
    }

    $trimmed = $Url.Trim()
    return $trimmed.StartsWith("http://") -or $trimmed.StartsWith("https://") -or $trimmed.StartsWith("/")
}

function Should-RefreshDemoImageUrl {
    param([string]$Url)

    if (-not (Has-UsableImageUrl $Url)) {
        return $true
    }

    return $Url.Contains("dummyimage.com") -or
        $Url.Contains("placehold.co") -or
        $Url.Contains("?text=") -or
        $Url.Contains("&text=")
}

function Ensure-Category {
    param(
        [array]$ExistingCategories,
        [string]$Name,
        [string]$Slug
    )

    $found = Find-CategoryByAliases -Categories $ExistingCategories -Aliases @($Slug, $Name)
    if ($found) {
        $label = Get-PropertyValue $found @("slug", "name", "title", "displayName")
        Write-Host "Reused category: $Slug -> $label"
        return $found
    }

    Write-Host "Creating category: $Slug"
    $created = Invoke-DemoApi -Method "POST" -Path "/api/categories" -Body @{
        name = $Name
        slug = $Slug
        status = "active"
    }

    if ($created) {
        Write-Host "Created category: $Slug"
        return $created
    }

    $reloadedCategories = Get-ApiList -Path "/api/categories"
    $foundAfterReload = Find-CategoryByAliases -Categories $reloadedCategories -Aliases @($Slug, $Name)
    if ($foundAfterReload) {
        $label = Get-PropertyValue $foundAfterReload @("slug", "name", "title", "displayName")
        Write-Host "Reused category after reload: $Slug -> $label"
        return $foundAfterReload
    }

    Write-Warning "Preferred category unavailable: $Slug"
    return $null
}

function Ensure-Journalist {
    param(
        [array]$ExistingUsers,
        [hashtable]$Payload
    )

    $username = $Payload.username
    $found = $ExistingUsers | Where-Object { (Normalize-Text (Get-PropertyValue $_ @("username"))) -eq (Normalize-Text $username) } | Select-Object -First 1
    if ($found) {
        $script:JournalistsReused++
        Write-Host "Reused journalist: $username (id=$($found.id)); refreshing profile fields"
        $updated = Invoke-DemoApi -Method "PATCH" -Path "/api/admin/users/$($found.id)/profile" -Body @{
            displayName = $Payload.displayName
            designation = $Payload.designation
            bio = $Payload.bio
            profileImageUrl = $Payload.profileImageUrl
            facebookUrl = $Payload.facebookUrl
            twitterUrl = $Payload.twitterUrl
            emailPublic = $Payload.emailPublic
            isPublic = $Payload.isPublic
        }
        if ($updated) {
            return $updated
        }
        return $found
    }

    $created = Invoke-DemoApi -Method "POST" -Path "/api/admin/users" -Body $Payload
    if ($created -and $created.id) {
        $script:JournalistsCreated++
        Write-Host "Created journalist: $username (id=$($created.id))"
        return $created
    }

    Write-Warning "Create failed for journalist, reloading users to find existing username: $username"
    $reloadedUsers = Get-ApiList -Path "/api/admin/users"
    $foundAfterReload = $reloadedUsers | Where-Object { (Normalize-Text (Get-PropertyValue $_ @("username"))) -eq (Normalize-Text $username) } | Select-Object -First 1
    if ($foundAfterReload) {
        $script:JournalistsReused++
        Write-Host "Reused journalist after reload: $username (id=$($foundAfterReload.id))"
        return $foundAfterReload
    }

    $reporters = Get-ApiList -Path "/api/admin/users/reporters"
    $reporterMatch = $reporters | Where-Object { (Normalize-Text (Get-PropertyValue $_ @("username"))) -eq (Normalize-Text $username) } | Select-Object -First 1
    if ($reporterMatch) {
        $script:JournalistsReused++
        Write-Host "Reused reporter option after reload: $username (id=$($reporterMatch.id))"
        return $reporterMatch
    }

    $script:JournalistsSkipped++
    Write-Warning "Could not create or reuse journalist: $username"
    return $null
}

function Ensure-News {
    param(
        [array]$ExistingNews,
        [hashtable]$Payload
    )

    $slug = $Payload.slug
    $title = $Payload.title
    $found = $ExistingNews | Where-Object {
        (Normalize-Text (Get-PropertyValue $_ @("slug"))) -eq (Normalize-Text $slug) -or
        (Normalize-Text (Get-PropertyValue $_ @("title"))) -eq (Normalize-Text $title)
    } | Select-Object -First 1
    if ($found) {
        $script:NewsSkippedDuplicates++
        Write-Host "Skipped duplicate news: $slug"
        $existingImageUrl = Get-PropertyValue $found @("imageUrl")
        if (Should-RefreshDemoImageUrl $existingImageUrl) {
            Write-Host "Updating missing/broken image for existing news: $slug"
            $updated = Invoke-DemoApi -Method "PUT" -Path "/api/news/$($found.id)" -Body $Payload
            if ($updated -and $updated.id) {
                Write-Host "Updated news image: $slug"
                return $updated
            }
        }
        return $found
    }

    $created = Invoke-DemoApi -Method "POST" -Path "/api/news" -Body $Payload
    if ($created -and $created.id) {
        $script:NewsCreated++
        Write-Host "Created news: $slug"
        return $created
    }

    $reloadedNews = Get-ApiList -Path "/api/news"
    $foundAfterReload = $reloadedNews | Where-Object {
        (Normalize-Text (Get-PropertyValue $_ @("slug"))) -eq (Normalize-Text $slug) -or
        (Normalize-Text (Get-PropertyValue $_ @("title"))) -eq (Normalize-Text $title)
    } | Select-Object -First 1
    if ($foundAfterReload) {
        $script:NewsSkippedDuplicates++
        Write-Host "Skipped duplicate news after reload: $slug"
        $existingImageUrl = Get-PropertyValue $foundAfterReload @("imageUrl")
        if (Should-RefreshDemoImageUrl $existingImageUrl) {
            Write-Host "Updating missing/broken image for existing news after reload: $slug"
            $updated = Invoke-DemoApi -Method "PUT" -Path "/api/news/$($foundAfterReload.id)" -Body $Payload
            if ($updated -and $updated.id) {
                Write-Host "Updated news image: $slug"
                return $updated
            }
        }
        return $foundAfterReload
    }

    Write-Warning "Could not create news: $slug"
    return $null
}

function Hide-DefaultPublicUsers {
    param([array]$ExistingUsers)

    $defaultUsernames = @("editor", "reporter")
    foreach ($user in $ExistingUsers) {
        if (-not ($defaultUsernames -contains $user.username)) {
            continue
        }

        $displayName = if ($user.displayName) { $user.displayName.Trim().ToLowerInvariant() } else { "" }
        if ($displayName -and $displayName -ne $user.username) {
            continue
        }

        if ($user.isPublic -eq $false) {
            continue
        }

        Write-Host "Hiding generic public user from journalist list: $($user.username)"
        Invoke-DemoApi -Method "PATCH" -Path "/api/admin/users/$($user.id)/profile" -Body @{
            displayName = $user.displayName
            designation = $user.designation
            bio = $user.bio
            profileImageUrl = $user.profileImageUrl
            facebookUrl = $user.facebookUrl
            twitterUrl = $user.twitterUrl
            emailPublic = $user.emailPublic
            isPublic = $false
        } | Out-Null
    }
}

Write-Host "Logging in to $BASE_URL as $ADMIN_EMAIL..."
$loginResponse = Invoke-DemoApi -Method "POST" -Path "/api/auth/login" -Anonymous -Body @{
    username = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
}

if (-not $loginResponse -or -not $loginResponse.token) {
    Write-Error "Login failed. Check BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD."
    exit 1
}

$script:AuthHeaders = @{
    Authorization = "Bearer $($loginResponse.token)"
}

$script:JournalistsReused = 0
$script:JournalistsCreated = 0
$script:JournalistsSkipped = 0
$script:NewsCreated = 0
$script:NewsSkippedDuplicates = 0
$script:NewsSkippedMissing = 0

Write-Host "Login succeeded. Loading existing users, categories, and news..."
$existingUsers = Get-ApiList -Path "/api/admin/users"
$existingCategories = Get-ApiList -Path "/api/categories"
$existingNews = Get-ApiList -Path "/api/news"
Hide-DefaultPublicUsers -ExistingUsers $existingUsers

# Edit category names/slugs here if your demo environment uses different categories.
$categorySeeds = @(
    @{ name = "জাতীয়"; slug = "national" },
    @{ name = "মহানগর"; slug = "city" },
    @{ name = "অনুসন্ধান"; slug = "investigation" },
    @{ name = "বিনোদন"; slug = "entertainment" },
    @{ name = "খেলাধুলা"; slug = "sports" },
    @{ name = "আন্তর্জাতিক"; slug = "international" },
    @{ name = "অর্থনীতি"; slug = "business" },
    @{ name = "ছবি"; slug = "photo-story" }
)

$categoryAliases = @{
    "national" = @("national", "জাতীয়")
    "city" = @("city", "মহানগর", "নগর", "ঢাকা", "জাতীয়")
    "investigation" = @("investigation", "অনুসন্ধান", "বিশেষ প্রতিবেদন", "জাতীয়")
    "entertainment" = @("entertainment", "বিনোদন")
    "sports" = @("sports", "খেলাধুলা", "খেলা")
    "international" = @("international", "আন্তর্জাতিক")
    "business" = @("business", "অর্থনীতি", "ব্যবসা")
    "photo-story" = @("photo-story", "ছবি", "ফিচার", "ফটো স্টোরি", "জাতীয়")
}

$categoryIndex = @{}
foreach ($categorySeed in $categorySeeds) {
    $category = Ensure-Category -ExistingCategories $existingCategories -Name $categorySeed.name -Slug $categorySeed.slug
    if (-not $category) {
        $existingCategories = Get-ApiList -Path "/api/categories"
    }
}

$existingCategories = Get-ApiList -Path "/api/categories"
$fallbackCategory = Get-FallbackCategory -Categories $existingCategories
foreach ($key in $categoryAliases.Keys) {
    $category = Find-CategoryByAliases -Categories $existingCategories -Aliases $categoryAliases[$key]
    if (-not $category) {
        $category = $fallbackCategory
    }

    if ($category -and $category.slug) {
        $categoryIndex[$key] = $category.slug
        Write-Host "Reused category mapping: $key -> $($category.slug)"
    } elseif ($category -and $category.name) {
        $categoryIndex[$key] = $category.name
        Write-Host "Reused category mapping: $key -> $($category.name)"
    } else {
        Write-Warning "No category available for key: $key"
    }
}

# Edit journalist names, bios, and avatar URLs here.
# Avatar URLs use generated illustration avatars, not real people or copyrighted profile photos.
$journalists = @(
    @{
        username = "mahir-hasan"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "মাহির হাসান"
        designation = "সিনিয়র রিপোর্টার"
        bio = "জাতীয় রাজনীতি, প্রশাসন ও নীতি-নির্ধারণী ইস্যু নিয়ে নিয়মিত প্রতিবেদন করেন। মাঠপর্যায়ের তথ্য যাচাই ও বিশ্লেষণধর্মী সংবাদ তৈরিতে তাঁর বিশেষ আগ্রহ রয়েছে।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=mahir-hasan"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "mahir@alochitosongbad.demo"
        isPublic = $true
    },
    @{
        username = "sabiha-rahman"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "সাবিহা রহমান"
        designation = "স্টাফ রিপোর্টার"
        bio = "নগর জীবন, সিটি করপোরেশন, নাগরিক সমস্যা ও জনসেবামূলক বিষয় নিয়ে কাজ করেন। সাধারণ মানুষের অভিজ্ঞতা তুলে ধরতে তিনি মাঠভিত্তিক রিপোর্টিংকে গুরুত্ব দেন।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=sabiha-rahman"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "sabiha@alochitosongbad.demo"
        isPublic = $true
    },
    @{
        username = "ariful-islam"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "আরিফুল ইসলাম"
        designation = "বিশেষ প্রতিনিধি"
        bio = "অনুসন্ধানী প্রতিবেদন, জনসেবা, দুর্নীতি ও স্থানীয় প্রশাসনের কার্যক্রম নিয়ে কাজ করেন। তথ্য-প্রমাণভিত্তিক রিপোর্টিংয়ে তিনি মনোযোগী।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=ariful-islam"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "ariful@alochitosongbad.demo"
        isPublic = $true
    },
    @{
        username = "nusrat-jahan"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "নুসরাত জাহান"
        designation = "বিনোদন প্রতিবেদক"
        bio = "চলচ্চিত্র, নাটক, ওটিটি, সংস্কৃতি ও তারকাজগতের খবর নিয়ে নিয়মিত লেখেন। বিনোদন অঙ্গনের পরিবর্তন ও দর্শক প্রবণতা নিয়ে তাঁর আগ্রহ বেশি।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=nusrat-jahan"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "nusrat@alochitosongbad.demo"
        isPublic = $true
    },
    @{
        username = "tanvir-ahmed"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "তানভীর আহমেদ"
        designation = "ক্রীড়া প্রতিবেদক"
        bio = "ক্রিকেট, ফুটবল ও দেশের ক্রীড়া প্রশাসন নিয়ে কাজ করেন। মাঠের খেলা ও পর্দার আড়ালের সিদ্ধান্ত—দুই দিকই তাঁর প্রতিবেদনে গুরুত্ব পায়।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=tanvir-ahmed"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "tanvir@alochitosongbad.demo"
        isPublic = $true
    },
    @{
        username = "raiyan-kabir"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "রাইয়ান কবির"
        designation = "আন্তর্জাতিক ডেস্ক"
        bio = "দক্ষিণ এশিয়া, মধ্যপ্রাচ্য ও বৈশ্বিক রাজনীতি নিয়ে সংবাদ বিশ্লেষণ করেন। আন্তর্জাতিক ঘটনার স্থানীয় প্রভাব ব্যাখ্যা করাই তাঁর প্রতিবেদনের মূল লক্ষ্য।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=raiyan-kabir"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "raiyan@alochitosongbad.demo"
        isPublic = $true
    },
    @{
        username = "farhana-mim"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "ফারহানা মিম"
        designation = "অর্থনীতি প্রতিবেদক"
        bio = "বাজার, ব্যাংক, ব্যবসা, ভোক্তা অধিকার ও অর্থনৈতিক নীতি নিয়ে প্রতিবেদন করেন। জটিল অর্থনৈতিক বিষয় সহজ ভাষায় তুলে ধরতে তিনি আগ্রহী।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=farhana-mim"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "farhana@alochitosongbad.demo"
        isPublic = $true
    },
    @{
        username = "imran-hossain"
        password = $DEMO_USER_PASSWORD
        role = "reporter"
        status = "active"
        displayName = "ইমরান হোসেন"
        designation = "ফটো সাংবাদিক"
        bio = "ফটো স্টোরি, মাঠ প্রতিবেদন ও ভিজ্যুয়াল সাংবাদিকতায় কাজ করেন। গুরুত্বপূর্ণ ঘটনার মানবিক দিক ক্যামেরার ভাষায় তুলে ধরাই তাঁর লক্ষ্য।"
        profileImageUrl = "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=imran-hossain"
        facebookUrl = ""
        twitterUrl = ""
        emailPublic = "imran@alochitosongbad.demo"
        isPublic = $true
    }
)

$journalistIndex = @{}
foreach ($journalist in $journalists) {
    $saved = Ensure-Journalist -ExistingUsers $existingUsers -Payload $journalist
    if ($saved -and $saved.id) {
        $journalistIndex[$journalist.username] = $saved
    }
}

if ($journalistIndex.Count -eq 0) {
    Write-Warning "No journalist IDs are available after first pass. Reloading users and trying one more time."
    $existingUsers = Get-ApiList -Path "/api/admin/users"
    foreach ($journalist in $journalists) {
        $saved = $existingUsers | Where-Object { (Normalize-Text (Get-PropertyValue $_ @("username"))) -eq (Normalize-Text $journalist.username) } | Select-Object -First 1
        if ($saved -and $saved.id) {
            $journalistIndex[$journalist.username] = $saved
            $script:JournalistsReused++
            Write-Host "Reused journalist after final reload: $($journalist.username) (id=$($saved.id))"
        }
    }
}

if ($journalistIndex.Count -eq 0) {
    Write-Warning "No journalist IDs are available. News creation will be skipped, but the script will not delete or modify existing news."
}

# Edit news titles, content, tags, and images here.
# imageUrl values use seeded generic photos without visible text.
$articles = @(
    @{
        authorUsername = "mahir-hasan"; category = "national"; slug = "proshasonik-sebay-goti-ante-notun-nirdeshona"; title = "প্রশাসনিক সেবায় গতি আনতে নতুন নির্দেশনা"; subtitle = "জনসেবা সহজ করতে মাঠ প্রশাসনে সমন্বয় বাড়ানোর নির্দেশ দেওয়া হয়েছে।"; tags = @("প্রশাসন", "জনসেবা", "জাতীয়"); publishOffset = -1
        content = @"
<p>প্রশাসনিক সেবায় গতি আনতে নতুন নির্দেশনা জারি করা হয়েছে। মাঠ পর্যায়ের দপ্তরগুলোকে নাগরিক সেবার সময়সীমা স্পষ্টভাবে জানাতে বলা হয়েছে।</p>
<p>নির্দেশনায় বলা হয়েছে, আবেদন গ্রহণ থেকে নিষ্পত্তি পর্যন্ত প্রতিটি ধাপ নথিভুক্ত রাখতে হবে। এতে সেবাগ্রহীতাদের ভোগান্তি কমবে বলে আশা করছেন সংশ্লিষ্টরা।</p>
<p>স্থানীয় প্রশাসনের কর্মকর্তারা জানিয়েছেন, সেবা প্রদানের অগ্রগতি নিয়মিত পর্যালোচনা করা হবে। নাগরিক অভিযোগ দ্রুত নিষ্পত্তির জন্য পৃথক ফোকাল পয়েন্টও রাখা হচ্ছে।</p>
<p>বিশেষজ্ঞদের মতে, নির্দেশনা বাস্তবায়নে নজরদারি ও জবাবদিহি নিশ্চিত করা সবচেয়ে গুরুত্বপূর্ণ।</p>
"@
    },
    @{
        authorUsername = "mahir-hasan"; category = "national"; slug = "jela-porjaye-unnoyon-prokolpo-todarokite-bishesh-dol"; title = "জেলা পর্যায়ে উন্নয়ন প্রকল্প তদারকিতে বিশেষ দল"; subtitle = "চলমান প্রকল্পের অগ্রগতি দেখতে মাঠ পর্যায়ে বিশেষ তদারকি দল কাজ করবে।"; tags = @("উন্নয়ন", "জেলা", "প্রকল্প"); publishOffset = -2
        content = @"
<p>জেলা পর্যায়ে উন্নয়ন প্রকল্পের অগ্রগতি পর্যবেক্ষণে বিশেষ তদারকি দল গঠন করা হয়েছে। দলগুলো প্রকল্প এলাকার বাস্তব অবস্থা যাচাই করবে।</p>
<p>প্রশাসনের পক্ষ থেকে বলা হয়েছে, সময়মতো কাজ শেষ না হলে সংশ্লিষ্ট দপ্তরকে কারণ ব্যাখ্যা করতে হবে। ব্যয়ের স্বচ্ছতা ও কাজের মান নিয়েও প্রতিবেদন জমা দিতে হবে।</p>
<p>স্থানীয় বাসিন্দারা আশা করছেন, নিয়মিত তদারকি হলে দীর্ঘদিন ধরে আটকে থাকা প্রকল্পগুলোতে গতি আসবে।</p>
"@
    },
    @{
        authorUsername = "mahir-hasan"; category = "national"; slug = "songshodiyo-komitir-boithoke-jonseba-niye-alochona"; title = "সংসদীয় কমিটির বৈঠকে জনসেবা নিয়ে আলোচনা"; subtitle = "সরকারি সেবা আরও সহজ ও স্বচ্ছ করতে বিভিন্ন প্রস্তাব নিয়ে আলোচনা হয়েছে।"; tags = @("সংসদ", "জনসেবা", "নীতি"); publishOffset = -3
        content = @"
<p>সংসদীয় কমিটির বৈঠকে সরকারি সেবার মানোন্নয়ন নিয়ে বিস্তারিত আলোচনা হয়েছে। নাগরিক সেবায় ডিজিটাল ব্যবস্থার ব্যবহার বাড়ানোর ওপর গুরুত্ব দেওয়া হয়েছে।</p>
<p>বৈঠকে দপ্তরভিত্তিক সেবা সময়সীমা, অভিযোগ ব্যবস্থাপনা এবং তথ্যপ্রাপ্তির সুযোগ নিয়ে সদস্যরা মতামত দেন।</p>
<p>কমিটির পক্ষ থেকে বলা হয়েছে, জনসেবায় স্বচ্ছতা বাড়াতে নিয়মিত প্রতিবেদন প্রকাশ করা প্রয়োজন।</p>
"@
    },
    @{
        authorUsername = "sabiha-rahman"; category = "city"; slug = "rajdhani-bazare-nittoponner-dame-osthirata"; title = "রাজধানীর বাজারে নিত্যপণ্যের দামে অস্থিরতা"; subtitle = "ক্রেতারা বলছেন, বাজারভেদে একই পণ্যের দামে বড় পার্থক্য দেখা যাচ্ছে।"; tags = @("নগর", "বাজার", "ভোক্তা"); publishOffset = -1
        content = @"
<p>রাজধানীর বিভিন্ন বাজারে নিত্যপণ্যের দামে অস্থিরতা দেখা গেছে। সবজি, মাছ ও ডিমের দামে বাজারভেদে উল্লেখযোগ্য পার্থক্য রয়েছে।</p>
<p>ক্রেতাদের অভিযোগ, পাইকারি দামের সঙ্গে খুচরা দামের ব্যবধান অনেক বেশি। নিয়মিত তদারকি না থাকায় সাধারণ মানুষ চাপের মুখে পড়ছেন।</p>
<p>ব্যবসায়ীরা সরবরাহ ব্যয় ও পরিবহন খরচ বৃদ্ধিকে দামের ওঠানামার কারণ হিসেবে উল্লেখ করেছেন।</p>
"@
    },
    @{
        authorUsername = "sabiha-rahman"; category = "city"; slug = "jolabadhoota-komate-city-corporationer-notun-udjog"; title = "জলাবদ্ধতা কমাতে সিটি করপোরেশনের নতুন উদ্যোগ"; subtitle = "বর্ষার আগে নালা পরিষ্কার ও পানি নিষ্কাশন ব্যবস্থা উন্নয়নের কাজ শুরু হয়েছে।"; tags = @("সিটি করপোরেশন", "জলাবদ্ধতা", "ঢাকা"); publishOffset = -4
        content = @"
<p>জলাবদ্ধতা কমাতে সিটি করপোরেশন নতুন উদ্যোগ নিয়েছে। গুরুত্বপূর্ণ এলাকার নালা পরিষ্কার ও ড্রেনেজ ব্যবস্থার সংস্কার শুরু হয়েছে।</p>
<p>কর্মকর্তারা জানিয়েছেন, ঝুঁকিপূর্ণ পয়েন্টগুলো চিহ্নিত করে দ্রুত ব্যবস্থা নেওয়া হচ্ছে। নাগরিকদেরও বর্জ্য ব্যবস্থাপনায় সচেতন থাকার অনুরোধ করা হয়েছে।</p>
<p>বাসিন্দারা বলছেন, পরিকল্পনা বাস্তবায়ন হলে বর্ষায় ভোগান্তি কিছুটা কমতে পারে।</p>
"@
    },
    @{
        authorUsername = "sabiha-rahman"; category = "city"; slug = "gonoporibohone-jatrishebar-man-niye-khobh"; title = "গণপরিবহনে যাত্রীসেবার মান নিয়ে ক্ষোভ"; subtitle = "অতিরিক্ত ভাড়া, দীর্ঘ অপেক্ষা ও ভিড় নিয়ে যাত্রীদের অভিযোগ বাড়ছে।"; tags = @("গণপরিবহন", "নাগরিক", "সেবা"); publishOffset = -5
        content = @"
<p>রাজধানীর গণপরিবহনে যাত্রীসেবার মান নিয়ে ক্ষোভ প্রকাশ করেছেন সাধারণ যাত্রীরা। দীর্ঘ অপেক্ষা, অতিরিক্ত ভাড়া ও ভিড় তাদের প্রধান অভিযোগ।</p>
<p>যাত্রীরা বলছেন, অফিস সময়ের আগে-পরে বাসের সংখ্যা বাড়ানো জরুরি। বাসস্টপে শৃঙ্খলা না থাকায় ভোগান্তি আরও বাড়ছে।</p>
<p>পরিবহন সংশ্লিষ্টরা দাবি করছেন, যানজট ও পরিচালন ব্যয় বৃদ্ধির কারণে সেবার মান ধরে রাখা কঠিন হচ্ছে।</p>
"@
    },
    @{
        authorUsername = "ariful-islam"; category = "investigation"; slug = "upazila-shasthokendre-seba-sonkoter-ovijog"; title = "উপজেলা স্বাস্থ্যকেন্দ্রে সেবা সংকটের অভিযোগ"; subtitle = "চিকিৎসক সংকট ও প্রয়োজনীয় যন্ত্রপাতির অভাবে রোগীরা ভোগান্তিতে পড়ছেন।"; tags = @("স্বাস্থ্য", "অনুসন্ধান", "জনসেবা"); publishOffset = -2
        content = @"
<p>একটি উপজেলা স্বাস্থ্যকেন্দ্রে সেবা সংকটের অভিযোগ উঠেছে। রোগী ও স্বজনরা বলছেন, চিকিৎসক সংকটের কারণে দীর্ঘ সময় অপেক্ষা করতে হচ্ছে।</p>
<p>স্বাস্থ্যকেন্দ্রের কয়েকটি জরুরি যন্ত্রপাতি অচল থাকায় অনেক রোগীকে জেলা শহরে পাঠানো হচ্ছে। এতে দরিদ্র পরিবারের ওপর বাড়তি ব্যয় চাপছে।</p>
<p>কর্তৃপক্ষ জানিয়েছে, সংকট সমাধানে ঊর্ধ্বতন দপ্তরে চাহিদাপত্র পাঠানো হয়েছে।</p>
"@
    },
    @{
        authorUsername = "ariful-islam"; category = "investigation"; slug = "sorkari-doptore-voganti-komate-digital-seba-chalu"; title = "সরকারি দপ্তরে ভোগান্তি কমাতে ডিজিটাল সেবা চালু"; subtitle = "সেবা নিতে দীর্ঘ সারি কমাতে অনলাইন আবেদন ব্যবস্থা চালুর উদ্যোগ নেওয়া হয়েছে।"; tags = @("ডিজিটাল সেবা", "সরকারি দপ্তর", "নাগরিক"); publishOffset = -6
        content = @"
<p>সরকারি দপ্তরে নাগরিক ভোগান্তি কমাতে নতুন ডিজিটাল সেবা চালু করা হয়েছে। অনলাইনে আবেদন, ফি জমা ও অগ্রগতি জানার সুযোগ রাখা হয়েছে।</p>
<p>সেবাগ্রহীতারা বলছেন, অনলাইন ব্যবস্থা কার্যকর হলে দালালচক্রের দৌরাত্ম্য কমতে পারে। তবে গ্রামের মানুষের জন্য সহায়তা কেন্দ্র প্রয়োজন।</p>
<p>দপ্তরের কর্মকর্তারা জানিয়েছেন, পরীক্ষামূলক পর্যায়ের অভিজ্ঞতা দেখে ব্যবস্থা আরও উন্নত করা হবে।</p>
"@
    },
    @{
        authorUsername = "ariful-islam"; category = "investigation"; slug = "sthaniyo-sorok-meramote-oniomer-ovijog"; title = "স্থানীয় সড়ক মেরামতে অনিয়মের অভিযোগ"; subtitle = "বাসিন্দাদের দাবি, কাজ শেষ হওয়ার আগেই সড়কের বিভিন্ন অংশে ফাটল দেখা দিয়েছে।"; tags = @("সড়ক", "অনিয়ম", "স্থানীয় প্রশাসন"); publishOffset = -7
        content = @"
<p>স্থানীয় একটি সড়ক মেরামত কাজে অনিয়মের অভিযোগ করেছেন বাসিন্দারা। তাদের দাবি, নিম্নমানের উপকরণ ব্যবহারের কারণে কাজ শেষ হওয়ার আগেই ফাটল দেখা দিয়েছে।</p>
<p>ঠিকাদারি প্রতিষ্ঠানের প্রতিনিধি অভিযোগ অস্বীকার করে বলেছেন, নির্ধারিত মান বজায় রেখেই কাজ চলছে।</p>
<p>স্থানীয় প্রশাসন জানিয়েছে, লিখিত অভিযোগ পেলে কাজের মান পরীক্ষা করা হবে।</p>
"@
    },
    @{
        authorUsername = "nusrat-jahan"; category = "entertainment"; slug = "eider-natok-niye-byasto-nirmata-shilpira"; title = "ঈদের নাটক নিয়ে ব্যস্ত নির্মাতা-শিল্পীরা"; subtitle = "নতুন গল্প, লোকেশন ও তরুণ অভিনয়শিল্পীদের নিয়ে শেষ মুহূর্তের কাজ চলছে।"; tags = @("বিনোদন", "নাটক", "ঈদ"); publishOffset = -1
        content = @"
<p>ঈদের নাটক ঘিরে ব্যস্ত সময় পার করছেন নির্মাতা ও অভিনয়শিল্পীরা। রাজধানী ও আশপাশের বিভিন্ন লোকেশনে চলছে শেষ মুহূর্তের শুটিং।</p>
<p>নির্মাতারা বলছেন, দর্শকের রুচি বদলেছে। তাই এবার গল্প ও চরিত্র নির্মাণে বাস্তব অভিজ্ঞতাকে বেশি গুরুত্ব দেওয়া হচ্ছে।</p>
<p>অনলাইন প্ল্যাটফর্মের জন্যও আলাদা কনটেন্ট তৈরি করছেন অনেকে।</p>
"@
    },
    @{
        authorUsername = "nusrat-jahan"; category = "entertainment"; slug = "notun-cinema-mukti-ghire-prekkhagrihe-prostuti"; title = "নতুন সিনেমা মুক্তি ঘিরে প্রেক্ষাগৃহে প্রস্তুতি"; subtitle = "দর্শক টানতে প্রচারণা ও হল ব্যবস্থাপনায় নতুন পরিকল্পনা নেওয়া হয়েছে।"; tags = @("সিনেমা", "প্রেক্ষাগৃহ", "সংস্কৃতি"); publishOffset = -3
        content = @"
<p>নতুন সিনেমা মুক্তি ঘিরে দেশের কয়েকটি প্রেক্ষাগৃহে প্রস্তুতি শুরু হয়েছে। হল কর্তৃপক্ষ আসন, শব্দ ও প্রদর্শন ব্যবস্থায় সংস্কার করেছে।</p>
<p>প্রযোজনা প্রতিষ্ঠানগুলো সামাজিক যোগাযোগমাধ্যমে প্রচারণা বাড়িয়েছে। শিল্পীরাও দর্শকের সঙ্গে সরাসরি যোগাযোগের পরিকল্পনা করছেন।</p>
<p>সংশ্লিষ্টরা আশা করছেন, ভালো গল্প ও প্রচারণা হলে দর্শক আবার হলে ফিরবেন।</p>
"@
    },
    @{
        authorUsername = "nusrat-jahan"; category = "entertainment"; slug = "torun-shilpider-gaan-niye-shrotader-agroho"; title = "তরুণ শিল্পীদের গান নিয়ে শ্রোতাদের আগ্রহ"; subtitle = "ডিজিটাল প্ল্যাটফর্মে নতুন শিল্পীদের গান দ্রুত ছড়িয়ে পড়ছে।"; tags = @("গান", "তরুণ শিল্পী", "ওটিটি"); publishOffset = -8
        content = @"
<p>তরুণ শিল্পীদের নতুন গান নিয়ে শ্রোতাদের আগ্রহ বাড়ছে। ডিজিটাল প্ল্যাটফর্মের কারণে নতুন কণ্ঠ দ্রুত পরিচিতি পাচ্ছে।</p>
<p>সঙ্গীত সংশ্লিষ্টরা বলছেন, ভালো লেখা ও মৌলিক সুর থাকলে শ্রোতা এখন সহজেই গান গ্রহণ করছেন।</p>
<p>তবে কপিরাইট সুরক্ষা ও পেশাদার প্রচারণা নিয়ে আরও কাজ দরকার বলে মনে করেন শিল্পীরা।</p>
"@
    },
    @{
        authorUsername = "tanvir-ahmed"; category = "sports"; slug = "series-samne-rekhe-jatiyo-doler-onushilon-shuru"; title = "সিরিজ সামনে রেখে জাতীয় দলের অনুশীলন শুরু"; subtitle = "ফিটনেস, ব্যাটিং পরিকল্পনা ও বোলিং বৈচিত্র্যে গুরুত্ব দিচ্ছে টিম ম্যানেজমেন্ট।"; tags = @("ক্রিকেট", "জাতীয় দল", "অনুশীলন"); publishOffset = -1
        content = @"
<p>আসন্ন সিরিজ সামনে রেখে জাতীয় দলের অনুশীলন শুরু হয়েছে। প্রথম দিনেই ফিটনেস ও স্কিল সেশনে খেলোয়াড়দের ব্যস্ত দেখা যায়।</p>
<p>কোচিং স্টাফ জানিয়েছে, প্রতিপক্ষের শক্তি বিবেচনায় ব্যাটিং পরিকল্পনা ও বোলিং বৈচিত্র্যে বিশেষ মনোযোগ দেওয়া হচ্ছে।</p>
<p>সিনিয়র খেলোয়াড়দের পাশাপাশি কয়েকজন তরুণ ক্রিকেটারও অনুশীলনে নজর কেড়েছেন।</p>
"@
    },
    @{
        authorUsername = "tanvir-ahmed"; category = "sports"; slug = "sthaniyo-football-league-e-notun-protivar-jholok"; title = "স্থানীয় ফুটবল লিগে নতুন প্রতিভার ঝলক"; subtitle = "জেলা পর্যায়ের লিগে তরুণ ফুটবলারদের পারফরম্যান্স নজর কাড়ছে।"; tags = @("ফুটবল", "স্থানীয় লিগ", "তরুণ"); publishOffset = -4
        content = @"
<p>স্থানীয় ফুটবল লিগে কয়েকজন তরুণ খেলোয়াড়ের পারফরম্যান্স নজর কেড়েছে। কোচরা বলছেন, নিয়মিত সুযোগ পেলে তারা বড় মঞ্চে খেলতে পারবেন।</p>
<p>দর্শক উপস্থিতিও আগের তুলনায় বেশি ছিল। আয়োজকেরা মনে করছেন, স্থানীয় প্রতিযোগিতা বাড়লে ফুটবলের ভিত্তি শক্ত হবে।</p>
<p>ক্লাব প্রতিনিধিরা প্রতিভা বাছাইয়ে জেলা লিগকে গুরুত্ব দেওয়ার কথা জানিয়েছেন।</p>
"@
    },
    @{
        authorUsername = "tanvir-ahmed"; category = "sports"; slug = "krira-obokathamo-unnoyone-notun-porikolpona"; title = "ক্রীড়া অবকাঠামো উন্নয়নে নতুন পরিকল্পনা"; subtitle = "জেলা স্টেডিয়াম ও প্রশিক্ষণ মাঠ সংস্কারে অগ্রাধিকার দেওয়া হচ্ছে।"; tags = @("ক্রীড়া", "অবকাঠামো", "স্টেডিয়াম"); publishOffset = -9
        content = @"
<p>ক্রীড়া অবকাঠামো উন্নয়নে নতুন পরিকল্পনা নেওয়া হয়েছে। জেলা স্টেডিয়াম, প্রশিক্ষণ মাঠ ও ইনডোর সুবিধা সংস্কারে অগ্রাধিকার দেওয়া হবে।</p>
<p>ক্রীড়া সংগঠকেরা বলছেন, ভালো মাঠ ও নিয়মিত প্রশিক্ষণ ছাড়া প্রতিভা ধরে রাখা কঠিন।</p>
<p>পরিকল্পনায় নারী ও কিশোর খেলোয়াড়দের জন্য আলাদা প্রশিক্ষণ সুবিধার কথাও রয়েছে।</p>
"@
    },
    @{
        authorUsername = "raiyan-kabir"; category = "international"; slug = "dokkhin-asia-ancholik-shohogita-niye-notun-alochona"; title = "দক্ষিণ এশিয়ায় আঞ্চলিক সহযোগিতা নিয়ে নতুন আলোচনা"; subtitle = "বাণিজ্য, যোগাযোগ ও জলবায়ু ঝুঁকি মোকাবিলায় যৌথ উদ্যোগের ওপর জোর দেওয়া হয়েছে।"; tags = @("আন্তর্জাতিক", "দক্ষিণ এশিয়া", "সহযোগিতা"); publishOffset = -2
        content = @"
<p>দক্ষিণ এশিয়ায় আঞ্চলিক সহযোগিতা নিয়ে নতুন আলোচনা শুরু হয়েছে। বাণিজ্য, যোগাযোগ ও জলবায়ু ঝুঁকি মোকাবিলায় যৌথ উদ্যোগের ওপর গুরুত্ব দেওয়া হচ্ছে।</p>
<p>বিশ্লেষকেরা বলছেন, আঞ্চলিক সংযোগ বাড়লে ছোট অর্থনীতির জন্য নতুন সুযোগ তৈরি হতে পারে। তবে রাজনৈতিক আস্থার সংকট বড় চ্যালেঞ্জ।</p>
<p>আলোচনায় সীমান্ত বাণিজ্য সহজ করা এবং দুর্যোগ ব্যবস্থাপনায় তথ্য বিনিময়ের প্রস্তাবও এসেছে।</p>
"@
    },
    @{
        authorUsername = "raiyan-kabir"; category = "international"; slug = "moddhoprachyer-uttejona-bazare-probhaver-shonka"; title = "মধ্যপ্রাচ্যের উত্তেজনায় বাজারে প্রভাবের শঙ্কা"; subtitle = "জ্বালানি সরবরাহ ও আমদানি ব্যয়ে নতুন চাপ তৈরি হতে পারে বলে আশঙ্কা করছেন বিশ্লেষকেরা।"; tags = @("মধ্যপ্রাচ্য", "বাজার", "জ্বালানি"); publishOffset = -5
        content = @"
<p>মধ্যপ্রাচ্যের সাম্প্রতিক উত্তেজনায় আন্তর্জাতিক বাজারে প্রভাবের শঙ্কা দেখা দিয়েছে। জ্বালানি সরবরাহে অনিশ্চয়তা থাকলে আমদানি ব্যয় বাড়তে পারে।</p>
<p>বাংলাদেশের মতো আমদানিনির্ভর অর্থনীতির জন্য পরিস্থিতি পর্যবেক্ষণ জরুরি বলে মনে করছেন অর্থনীতিবিদরা।</p>
<p>তবে বাজারের তাৎক্ষণিক প্রতিক্রিয়া নির্ভর করবে কূটনৈতিক পরিস্থিতি ও সরবরাহ চেইনের ওপর।</p>
"@
    },
    @{
        authorUsername = "raiyan-kabir"; category = "international"; slug = "jolbayu-sommelon-e-unnoyonshil-desher-dabi"; title = "জলবায়ু সম্মেলনে উন্নয়নশীল দেশের দাবি"; subtitle = "ক্ষতিপূরণ, অভিযোজন তহবিল ও প্রযুক্তি সহায়তায় দ্রুত সিদ্ধান্ত চেয়েছে ঝুঁকিপূর্ণ দেশগুলো।"; tags = @("জলবায়ু", "সম্মেলন", "উন্নয়নশীল দেশ"); publishOffset = -10
        content = @"
<p>জলবায়ু সম্মেলনে উন্নয়নশীল দেশগুলো ক্ষতিপূরণ ও অভিযোজন তহবিল দ্রুত ছাড়ের দাবি জানিয়েছে। ঝুঁকিপূর্ণ দেশগুলো বলছে, প্রতিশ্রুতি বাস্তবায়নে দেরি হলে ক্ষতি আরও বাড়বে।</p>
<p>সম্মেলনে প্রযুক্তি সহায়তা ও জলবায়ু সহনশীল অবকাঠামো নিয়েও আলোচনা হয়েছে।</p>
<p>বাংলাদেশসহ উপকূলীয় দেশগুলো স্থানীয় জনগোষ্ঠীর সুরক্ষাকে অগ্রাধিকার দেওয়ার আহ্বান জানিয়েছে।</p>
"@
    },
    @{
        authorUsername = "farhana-mim"; category = "business"; slug = "bank-khate-sebar-man-barate-notun-nirdeshona"; title = "ব্যাংক খাতে সেবার মান বাড়াতে নতুন নির্দেশনা"; subtitle = "গ্রাহক অভিযোগ নিষ্পত্তি ও ডিজিটাল সেবায় স্বচ্ছতা বাড়ানোর ওপর জোর দেওয়া হয়েছে।"; tags = @("ব্যাংক", "অর্থনীতি", "গ্রাহকসেবা"); publishOffset = -1
        content = @"
<p>ব্যাংক খাতে সেবার মান বাড়াতে নতুন নির্দেশনা দেওয়া হয়েছে। গ্রাহক অভিযোগ নিষ্পত্তি, ডিজিটাল লেনদেনের নিরাপত্তা ও শাখা সেবায় স্বচ্ছতা বাড়ানোর কথা বলা হয়েছে।</p>
<p>ব্যাংক কর্মকর্তারা জানিয়েছেন, অভিযোগ ব্যবস্থাপনা আরও দ্রুত করতে আলাদা পর্যবেক্ষণ ব্যবস্থা রাখা হবে।</p>
<p>গ্রাহক অধিকার নিয়ে কাজ করা সংগঠনগুলো নির্দেশনা বাস্তবায়নে নিয়মিত তদারকির আহ্বান জানিয়েছে।</p>
"@
    },
    @{
        authorUsername = "farhana-mim"; category = "business"; slug = "khudro-byaboshayider-rin-subidha-baranor-dabi"; title = "ক্ষুদ্র ব্যবসায়ীদের ঋণ সুবিধা বাড়ানোর দাবি"; subtitle = "ব্যবসা টিকিয়ে রাখতে সহজ শর্তে ঋণ ও প্রশিক্ষণ সহায়তা চেয়েছেন উদ্যোক্তারা।"; tags = @("ক্ষুদ্র ব্যবসা", "ঋণ", "উদ্যোক্তা"); publishOffset = -6
        content = @"
<p>ক্ষুদ্র ব্যবসায়ীরা সহজ শর্তে ঋণ সুবিধা বাড়ানোর দাবি জানিয়েছেন। বাজার ব্যয় বৃদ্ধি ও বিক্রি কমে যাওয়ায় অনেক উদ্যোক্তা নতুন বিনিয়োগে সাহস পাচ্ছেন না।</p>
<p>ব্যবসায়ী প্রতিনিধিরা বলেছেন, শুধু ঋণ নয়, হিসাবরক্ষণ ও ডিজিটাল বিপণন প্রশিক্ষণও প্রয়োজন।</p>
<p>অর্থনীতিবিদদের মতে, ক্ষুদ্র ব্যবসা সচল থাকলে কর্মসংস্থান ও স্থানীয় অর্থনীতি শক্তিশালী হয়।</p>
"@
    },
    @{
        authorUsername = "farhana-mim"; category = "business"; slug = "bazare-shobjir-dame-shosti-mach-mangshe-chap"; title = "বাজারে সবজির দামে স্বস্তি, মাছ-মাংসে চাপ"; subtitle = "সরবরাহ বাড়ায় কিছু সবজির দাম কমলেও আমিষ পণ্যে ক্রেতাদের চাপ রয়ে গেছে।"; tags = @("বাজার", "ভোক্তা", "অর্থনীতি"); publishOffset = -8
        content = @"
<p>বাজারে কিছু সবজির দামে স্বস্তি ফিরেছে। সরবরাহ বাড়ায় কয়েকটি পণ্যের দাম গত সপ্তাহের তুলনায় কমেছে।</p>
<p>তবে মাছ ও মাংসের দামে চাপ অব্যাহত থাকায় ক্রেতাদের মোট ব্যয় খুব বেশি কমেনি। নিম্ন ও মধ্যবিত্ত পরিবারগুলো খরচ সামলাতে তালিকা ছোট করছেন।</p>
<p>ব্যবসায়ীরা বলছেন, পরিবহন ব্যয় ও পাইকারি বাজারের ওঠানামা খুচরা দামে প্রভাব ফেলছে।</p>
"@
    },
    @{
        authorUsername = "imran-hossain"; category = "photo-story"; slug = "nodivangon-elakay-manusher-dinjapon"; title = "নদীভাঙন এলাকায় মানুষের দিনযাপন"; subtitle = "ভাঙনের ঝুঁকি নিয়ে প্রতিদিনের জীবন চালিয়ে যাচ্ছেন নদীপাড়ের মানুষ।"; tags = @("ফটো স্টোরি", "নদীভাঙন", "মানুষ"); publishOffset = -2
        content = @"
<p>নদীভাঙন এলাকায় মানুষের দিনযাপন অনিশ্চয়তায় ঘেরা। ঘরবাড়ি, জমি ও জীবিকার ঝুঁকি নিয়েই নদীপাড়ের মানুষ প্রতিদিন নতুন দিনের মুখোমুখি হন।</p>
<p>অনেকে ঘর সরিয়ে নিয়েছেন নিরাপদ দূরত্বে। আবার কেউ কেউ জীবিকার কারণে ঝুঁকিপূর্ণ জায়গাতেই থেকে গেছেন।</p>
<p>ছবিতে উঠে এসেছে ভাঙনের ভয়, সংগ্রাম এবং টিকে থাকার নীরব গল্প।</p>
"@
    },
    @{
        authorUsername = "imran-hossain"; category = "photo-story"; slug = "puran-dhakar-soru-golite-jibikar-golpo"; title = "পুরান ঢাকার সরু গলিতে জীবিকার গল্প"; subtitle = "ছোট দোকান, কারিগর ও হকারদের ব্যস্ততায় পুরান ঢাকার জীবনচিত্র।"; tags = @("ফটো স্টোরি", "পুরান ঢাকা", "জীবিকা"); publishOffset = -5
        content = @"
<p>পুরান ঢাকার সরু গলিতে জীবিকার নানা গল্প ছড়িয়ে আছে। ছোট দোকান, কারখানা, কারিগর ও হকারদের ব্যস্ততায় সকাল থেকেই এলাকা সরব হয়ে ওঠে।</p>
<p>স্থান সংকট, যানজট ও পুরোনো ভবনের ঝুঁকি সত্ত্বেও মানুষ কাজ থামান না। প্রজন্মের পর প্রজন্ম ধরে গড়ে ওঠা পেশাগুলো এখনো টিকে আছে।</p>
<p>এই ফটো স্টোরিতে দেখা যায় শ্রম, ঐতিহ্য ও নগর বাস্তবতার একসঙ্গে চলা।</p>
"@
    },
    @{
        authorUsername = "imran-hossain"; category = "photo-story"; slug = "brishtiveja-shohore-kormojibi-manusher-voganti"; title = "বৃষ্টিভেজা শহরে কর্মজীবী মানুষের ভোগান্তি"; subtitle = "হঠাৎ বৃষ্টিতে সড়ক, ফুটপাত ও গণপরিবহনে বেড়েছে ভোগান্তি।"; tags = @("ফটো স্টোরি", "বৃষ্টি", "নগর"); publishOffset = -9
        content = @"
<p>হঠাৎ বৃষ্টিতে শহরের কর্মজীবী মানুষের ভোগান্তি বেড়েছে। অফিসগামী যাত্রীদের অনেকেই ভিজে সড়ক ও দীর্ঘ অপেক্ষার মুখে পড়েন।</p>
<p>কিছু এলাকায় ফুটপাত ডুবে যাওয়ায় পথচারীদের সড়কে নেমে চলতে দেখা যায়। গণপরিবহন সংকটও ভোগান্তি বাড়িয়েছে।</p>
<p>বৃষ্টিভেজা শহরের ছবিগুলোতে ধরা পড়েছে কর্মব্যস্ত মানুষের নিত্যদিনের সংগ্রাম।</p>
"@
    }
)

foreach ($article in $articles) {
    $author = $journalistIndex[$article.authorUsername]
    if (-not $author -or -not $author.id) {
        $script:NewsSkippedMissing++
        Write-Warning "Skipping news because author ID is missing: $($article.slug)"
        continue
    }

    if (-not $categoryIndex.ContainsKey($article.category)) {
        $fallback = Get-FallbackCategory -Categories $existingCategories
        if ($fallback -and $fallback.slug) {
            $categoryIndex[$article.category] = $fallback.slug
            Write-Warning "Using fallback category for $($article.category): $($fallback.slug)"
        } else {
            $script:NewsSkippedMissing++
            Write-Warning "Skipping news because no category is available: $($article.category)"
            continue
        }
    }

    $payload = @{
        title = $article.title
        subtitle = $article.subtitle
        content = $article.content
        imageUrl = New-NewsImageUrl -Category $article.category -Slug $article.slug
        imageCaption = "আলোচিত সংবাদের ডেমো ফিচার ছবি"
        imageSource = "Alochito Songbad demo image"
        imageAlt = $article.title
        status = "published"
        category = $categoryIndex[$article.category]
        reporterName = $article.authorUsername
        authorId = [long]$author.id
        source = "আলোচিত সংবাদ"
        tagNames = $article.tags
        seoTitle = $article.title
        seoDescription = $article.subtitle
        slug = $article.slug
        breaking = $false
        featured = ($article.publishOffset -eq -1)
        scheduledAt = ""
        publishDate = DateTimeValue -DaysFromToday $article.publishOffset -Hour 10
        viewCount = 0
    }

    $savedNews = Ensure-News -ExistingNews $existingNews -Payload $payload
    if ($savedNews -and $savedNews.id) {
        $existingNews = @($existingNews) + @($savedNews)
    }
}

Write-Host ""
Write-Host "Journalist demo data seeding complete."
Write-Host "Journalists prepared: $($journalists.Count)"
Write-Host "Journalists reused: $script:JournalistsReused"
Write-Host "Journalists created: $script:JournalistsCreated"
Write-Host "Journalists skipped: $script:JournalistsSkipped"
Write-Host "News items prepared: $($articles.Count)"
Write-Host "News created this run: $script:NewsCreated"
Write-Host "News skipped as duplicates: $script:NewsSkippedDuplicates"
Write-Host "News skipped due to missing journalist/category: $script:NewsSkippedMissing"
Write-Host ""
Write-Host "Review:"
Write-Host "1. /journalists"
Write-Host "2. /journalist/mahir-hasan"
Write-Host "3. /admin/news"

