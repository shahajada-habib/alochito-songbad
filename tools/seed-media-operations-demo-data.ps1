# ALOCHITO SONGBAD - Media Operations demo data seeder
#
# Usage:
# 1. Start the backend.
# 2. Start the frontend.
# 3. Run from the project root:
#    powershell -ExecutionPolicy Bypass -File tools/seed-media-operations-demo-data.ps1
#
# Notes:
# - This script uses existing admin APIs only.
# - It does not delete or modify existing data.
# - It skips recognizable demo records where practical, so it is safe to rerun.
# - Edit the configuration and sample data below to adjust the demo set.

$BASE_URL = "http://localhost:8082"
$ADMIN_EMAIL = "admin"
$ADMIN_PASSWORD = "1234"

$ErrorActionPreference = "Stop"

function Convert-ToJsonBody {
    param([hashtable]$Payload)
    return ($Payload | ConvertTo-Json -Depth 10)
}

function Invoke-OperationsApi {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null
    )

    $uri = "$BASE_URL$Path"
    try {
        if ($Body) {
            return Invoke-RestMethod -Method $Method -Uri $uri -Headers $script:AuthHeaders -ContentType "application/json" -Body (Convert-ToJsonBody $Body)
        }

        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $script:AuthHeaders
    }
    catch {
        Write-Warning "API $Method $Path failed: $($_.Exception.Message)"
        return $null
    }
}

function Get-OperationsList {
    param([string]$Path)

    $result = Invoke-OperationsApi -Method "GET" -Path $Path
    if ($null -eq $result) {
        return @()
    }

    return @($result)
}

function Ensure-DemoRecord {
    param(
        [string]$Path,
        [array]$Existing,
        [scriptblock]$Match,
        [hashtable]$Payload,
        [string]$Label
    )

    $found = $Existing | Where-Object $Match | Select-Object -First 1
    if ($found) {
        Write-Host "Skip existing: $Label"
        return $found
    }

    Write-Host "Create: $Label"
    return Invoke-OperationsApi -Method "POST" -Path $Path -Body $Payload
}

function Index-ByField {
    param(
        [array]$Items,
        [string]$Field
    )

    $index = @{}
    foreach ($item in $Items) {
        $value = $item.$Field
        if ($value -and -not $index.ContainsKey($value)) {
            $index[$value] = $item
        }
    }
    return $index
}

function DateOnly {
    param([int]$DaysFromToday)
    return (Get-Date).Date.AddDays($DaysFromToday).ToString("yyyy-MM-dd")
}

function DateTimeValue {
    param([int]$DaysFromToday, [int]$Hour, [int]$Minute = 0)
    return (Get-Date).Date.AddDays($DaysFromToday).AddHours($Hour).AddMinutes($Minute).ToString("yyyy-MM-ddTHH:mm:ss")
}

Write-Host "Logging in to $BASE_URL as $ADMIN_EMAIL..."

try {
    $loginBody = @{
        username = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    }
    $loginResponse = Invoke-RestMethod -Method "POST" -Uri "$BASE_URL/api/auth/login" -ContentType "application/json" -Body (Convert-ToJsonBody $loginBody)
    $token = $loginResponse.token
    if (-not $token) {
        throw "Login response did not include a token."
    }

    $script:AuthHeaders = @{
        Authorization = "Bearer $token"
    }
}
catch {
    Write-Error "Login failed. Check BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD. Details: $($_.Exception.Message)"
    exit 1
}

Write-Host "Login succeeded. Seeding Media Operations demo data..."

$staffPath = "/api/admin/operations/staff"
$departmentPath = "/api/admin/operations/departments"
$assignmentPath = "/api/admin/operations/assignments"
$adClientPath = "/api/admin/operations/ad-clients"
$adBookingPath = "/api/admin/operations/ad-bookings"
$invoicePath = "/api/admin/operations/invoices"
$expensePath = "/api/admin/operations/expenses"
$attendancePath = "/api/admin/operations/attendance"
$assetPath = "/api/admin/operations/assets"
$vendorPath = "/api/admin/operations/vendors"
$purchaseRequestPath = "/api/admin/operations/purchase-requests"
$purchaseOrderPath = "/api/admin/operations/purchase-orders"
$leaveRequestPath = "/api/admin/operations/leave-requests"
$staffDocumentPath = "/api/admin/operations/staff-documents"
$notificationPath = "/api/admin/operations/notifications"

# Departments / Desks
$departments = Get-OperationsList $departmentPath
$departmentSeeds = @(
    @{ name = "National Desk"; code = "DEMO-NAT"; description = "National reporting desk for politics, policy, and ministries."; status = "ACTIVE" },
    @{ name = "City Desk"; code = "DEMO-CITY"; description = "Dhaka city reporting, civic issues, and local services."; status = "ACTIVE" },
    @{ name = "Sports Desk"; code = "DEMO-SPORTS"; description = "Sports federation, clubs, and tournament coverage."; status = "ACTIVE" },
    @{ name = "Digital Desk"; code = "DEMO-DIGITAL"; description = "Digital publishing, video, live updates, and social packaging."; status = "ACTIVE" },
    @{ name = "Advertising Desk"; code = "DEMO-ADS"; description = "Advertising sales and campaign coordination."; status = "ACTIVE" },
    @{ name = "Finance Desk"; code = "DEMO-FIN"; description = "Office finance support, invoices, and payment follow-up."; status = "ACTIVE" }
)

foreach ($seed in $departmentSeeds) {
    [void](Ensure-DemoRecord -Path $departmentPath -Existing $departments -Match { $_.code -eq $seed.code } -Payload $seed -Label "Department $($seed.name)")
}
$departments = Get-OperationsList $departmentPath
$departmentByCode = Index-ByField -Items $departments -Field "code"

# Staff
$staff = Get-OperationsList $staffPath
$staffSeeds = @(
    @{ name = "Farhana Islam"; designation = "Senior Reporter"; department = "National Desk"; phone = "01711001001"; email = "demo.farhana@alochitosongbad.local"; joiningDate = DateOnly -680; status = "ACTIVE" },
    @{ name = "Rafiq Hasan"; designation = "Photo Journalist"; department = "City Desk"; phone = "01711001002"; email = "demo.rafiq@alochitosongbad.local"; joiningDate = DateOnly -520; status = "ACTIVE" },
    @{ name = "Nadia Rahman"; designation = "Assignment Editor"; department = "National Desk"; phone = "01711001003"; email = "demo.nadia@alochitosongbad.local"; joiningDate = DateOnly -740; status = "ACTIVE" },
    @{ name = "Tanvir Chowdhury"; designation = "Video Producer"; department = "Digital Desk"; phone = "01711001004"; email = "demo.tanvir@alochitosongbad.local"; joiningDate = DateOnly -300; status = "ACTIVE" },
    @{ name = "Mushfiq Alam"; designation = "Desk Editor"; department = "Digital Desk"; phone = "01711001005"; email = "demo.mushfiq@alochitosongbad.local"; joiningDate = DateOnly -900; status = "ACTIVE" },
    @{ name = "Samia Karim"; designation = "Sales Executive"; department = "Advertising Desk"; phone = "01711001006"; email = "demo.samia@alochitosongbad.local"; joiningDate = DateOnly -210; status = "ACTIVE" },
    @{ name = "Imran Hossain"; designation = "Accounts Assistant"; department = "Finance Desk"; phone = "01711001007"; email = "demo.imran@alochitosongbad.local"; joiningDate = DateOnly -180; status = "ACTIVE" }
)

foreach ($seed in $staffSeeds) {
    [void](Ensure-DemoRecord -Path $staffPath -Existing $staff -Match { $_.email -eq $seed.email } -Payload $seed -Label "Staff $($seed.designation)")
}
$staff = Get-OperationsList $staffPath
$staffByEmail = Index-ByField -Items $staff -Field "email"

# Assignments
$assignments = Get-OperationsList $assignmentPath
$assignmentSeeds = @(
    @{ title = "City market price follow-up"; description = "Compare rice, lentil, fish, and vegetable prices across Karwan Bazar and Mohammadpur."; assignedStaffId = $staffByEmail["demo.farhana@alochitosongbad.local"].id; category = "Economy"; location = "Dhaka"; deadline = DateTimeValue 1 17; priority = "HIGH"; status = "ASSIGNED"; notes = "Add vendor quotes and buyer reaction." },
    @{ title = "Flood preparation visuals"; description = "Collect visuals and short clips from low-lying areas preparing for monsoon water rise."; assignedStaffId = $staffByEmail["demo.rafiq@alochitosongbad.local"].id; category = "Environment"; location = "Keraniganj"; deadline = DateTimeValue 2 18; priority = "URGENT"; status = "IN_PROGRESS"; notes = "Coordinate with video producer for social cut." },
    @{ title = "Press briefing coverage"; description = "Attend afternoon ministry briefing and file quick update."; assignedStaffId = $staffByEmail["demo.nadia@alochitosongbad.local"].id; category = "Politics"; location = "Secretariat"; deadline = DateTimeValue 0 19; priority = "HIGH"; status = "SUBMITTED"; notes = "Need headline and fact check before publish." },
    @{ title = "Sports federation interview"; description = "Interview federation official about youth tournament preparation."; assignedStaffId = $staffByEmail["demo.farhana@alochitosongbad.local"].id; category = "Sports"; location = "Paltan"; deadline = DateTimeValue 3 15; priority = "MEDIUM"; status = "ASSIGNED"; notes = "Ask for tournament fixture and budget." },
    @{ title = "Local hospital service report"; description = "Report on outdoor patient pressure and medicine availability."; assignedStaffId = $staffByEmail["demo.rafiq@alochitosongbad.local"].id; category = "Health"; location = "Mirpur"; deadline = DateTimeValue 1 20; priority = "MEDIUM"; status = "DRAFT"; notes = "Photo desk support needed." },
    @{ title = "Election campaign watch"; description = "Track local candidate meetings and campaign rule compliance."; assignedStaffId = $staffByEmail["demo.nadia@alochitosongbad.local"].id; category = "Election"; location = "Gazipur"; deadline = DateTimeValue 4 21; priority = "URGENT"; status = "ASSIGNED"; notes = "Prepare timeline box." }
)

foreach ($seed in $assignmentSeeds) {
    [void](Ensure-DemoRecord -Path $assignmentPath -Existing $assignments -Match { $_.title -eq $seed.title } -Payload $seed -Label "Assignment $($seed.title)")
}

# Advertisement clients
$adClients = Get-OperationsList $adClientPath
$adClientSeeds = @(
    @{ clientName = "Rupali Properties Ltd"; companyName = "Rupali Properties Ltd"; contactPerson = "Mahmudul Karim"; phone = "01822002001"; email = "marketing@rupaliproperties.example"; address = "Gulshan, Dhaka"; industry = "Real Estate"; status = "ACTIVE"; notes = "Interested in homepage visibility during weekend property fair." },
    @{ clientName = "Dhaka Mart"; companyName = "Dhaka Mart"; contactPerson = "Sanjida Akter"; phone = "01822002002"; email = "ads@dhakamart.example"; address = "Dhanmondi, Dhaka"; industry = "Retail"; status = "ACTIVE"; notes = "Seasonal grocery campaign." },
    @{ clientName = "Metro Hospital"; companyName = "Metro Hospital"; contactPerson = "Dr. Arif Rahman"; phone = "01822002003"; email = "media@metrohospital.example"; address = "Uttara, Dhaka"; industry = "Healthcare"; status = "ACTIVE"; notes = "Health check package promotion." },
    @{ clientName = "EduCare Coaching"; companyName = "EduCare Coaching"; contactPerson = "Shaila Noor"; phone = "01822002004"; email = "hello@educare.example"; address = "Farmgate, Dhaka"; industry = "Education"; status = "ACTIVE"; notes = "Admission season ad placement." },
    @{ clientName = "GreenTech Solar"; companyName = "GreenTech Solar"; contactPerson = "Rezaul Amin"; phone = "01822002005"; email = "sales@greentechsolar.example"; address = "Banani, Dhaka"; industry = "Energy"; status = "ACTIVE"; notes = "Solar rooftop awareness campaign." }
)

foreach ($seed in $adClientSeeds) {
    [void](Ensure-DemoRecord -Path $adClientPath -Existing $adClients -Match { $_.clientName -eq $seed.clientName } -Payload $seed -Label "Ad client $($seed.clientName)")
}
$adClients = Get-OperationsList $adClientPath
$adClientByName = Index-ByField -Items $adClients -Field "clientName"

# Ad bookings / campaigns
$adBookings = Get-OperationsList $adBookingPath
$adBookingSeeds = @(
    @{ adClientId = $adClientByName["Rupali Properties Ltd"].id; title = "Homepage banner campaign"; placement = "HOME_TOP"; startDate = DateOnly -2; endDate = DateOnly 10; price = 85000; paymentStatus = "PARTIAL"; publishStatus = "RUNNING"; salesOwner = "Samia Karim"; notes = "Prime homepage banner for property fair." },
    @{ adClientId = $adClientByName["Dhaka Mart"].id; title = "Category page sidebar ad"; placement = "CATEGORY_PAGE"; startDate = DateOnly 1; endDate = DateOnly 14; price = 42000; paymentStatus = "UNPAID"; publishStatus = "SCHEDULED"; salesOwner = "Samia Karim"; notes = "Retail campaign for city/category pages." },
    @{ adClientId = $adClientByName["Metro Hospital"].id; title = "Sponsored feature placement"; placement = "ARTICLE_MIDDLE"; startDate = DateOnly -5; endDate = DateOnly 5; price = 65000; paymentStatus = "PAID"; publishStatus = "RUNNING"; salesOwner = "Samia Karim"; notes = "Native sponsored health feature." },
    @{ adClientId = $adClientByName["EduCare Coaching"].id; title = "Breaking ticker sponsorship"; placement = "HOME_SIDEBAR"; startDate = DateOnly 3; endDate = DateOnly 21; price = 55000; paymentStatus = "UNPAID"; publishStatus = "DRAFT"; salesOwner = "Samia Karim"; notes = "Awaiting final creative." }
)

foreach ($seed in $adBookingSeeds) {
    [void](Ensure-DemoRecord -Path $adBookingPath -Existing $adBookings -Match { $_.title -eq $seed.title } -Payload $seed -Label "Ad booking $($seed.title)")
}
$adBookings = Get-OperationsList $adBookingPath
$adBookingByTitle = Index-ByField -Items $adBookings -Field "title"

# Invoices
$invoices = Get-OperationsList $invoicePath
$invoiceSeeds = @(
    @{ adClientId = $adClientByName["Rupali Properties Ltd"].id; adBookingId = $adBookingByTitle["Homepage banner campaign"].id; invoiceNumber = "INV-AS-2026-001"; title = "Homepage banner campaign invoice"; amount = 85000; issueDate = DateOnly -3; dueDate = DateOnly 4; paymentStatus = "PARTIAL"; paidAmount = 40000; notes = "Balance due after first week of campaign." },
    @{ adClientId = $adClientByName["Dhaka Mart"].id; adBookingId = $adBookingByTitle["Category page sidebar ad"].id; invoiceNumber = "INV-AS-2026-002"; title = "Category sidebar campaign invoice"; amount = 42000; issueDate = DateOnly 0; dueDate = DateOnly 7; paymentStatus = "UNPAID"; paidAmount = 0; notes = "Payment follow-up before campaign start." },
    @{ adClientId = $adClientByName["Metro Hospital"].id; adBookingId = $adBookingByTitle["Sponsored feature placement"].id; invoiceNumber = "INV-AS-2026-003"; title = "Sponsored feature placement invoice"; amount = 65000; issueDate = DateOnly -7; dueDate = DateOnly -1; paymentStatus = "PAID"; paidAmount = 65000; notes = "Paid by bank transfer." },
    @{ adClientId = $adClientByName["EduCare Coaching"].id; adBookingId = $adBookingByTitle["Breaking ticker sponsorship"].id; invoiceNumber = "INV-AS-2026-004"; title = "Ticker sponsorship invoice"; amount = 55000; issueDate = DateOnly -2; dueDate = DateOnly 2; paymentStatus = "UNPAID"; paidAmount = 0; notes = "Creative pending, invoice issued for booking confirmation." }
)

foreach ($seed in $invoiceSeeds) {
    [void](Ensure-DemoRecord -Path $invoicePath -Existing $invoices -Match { $_.invoiceNumber -eq $seed.invoiceNumber } -Payload $seed -Label "Invoice $($seed.invoiceNumber)")
}

# Expenses
$expenses = Get-OperationsList $expensePath
$expenseSeeds = @(
    @{ title = "Reporter transport"; category = "TRANSPORT"; amount = 1800; expenseDate = DateOnly -1; paidBy = "Farhana Islam"; paymentMethod = "CASH"; status = "PAID"; notes = "Transport for market price follow-up." },
    @{ title = "Camera battery purchase"; category = "EQUIPMENT"; amount = 6200; expenseDate = DateOnly -4; paidBy = "Rafiq Hasan"; paymentMethod = "BKASH"; status = "APPROVED"; notes = "Replacement battery for field camera." },
    @{ title = "Internet bill"; category = "INTERNET"; amount = 4500; expenseDate = DateOnly -6; paidBy = "Imran Hossain"; paymentMethod = "BANK"; status = "PAID"; notes = "Office broadband monthly bill." },
    @{ title = "Event coverage snacks"; category = "FOOD"; amount = 2300; expenseDate = DateOnly 0; paidBy = "Nadia Rahman"; paymentMethod = "CASH"; status = "DRAFT"; notes = "Team snacks during extended press briefing coverage." },
    @{ title = "Freelance photo payment"; category = "REPORTING"; amount = 9000; expenseDate = DateOnly -2; paidBy = "Mushfiq Alam"; paymentMethod = "NAGAD"; status = "APPROVED"; notes = "Freelance contributor payment for remote district visuals." }
)

foreach ($seed in $expenseSeeds) {
    [void](Ensure-DemoRecord -Path $expensePath -Existing $expenses -Match { $_.title -eq $seed.title } -Payload $seed -Label "Expense $($seed.title)")
}

# Attendance / Duty roster
$attendance = Get-OperationsList $attendancePath
$attendanceSeeds = @(
    @{ staffId = $staffByEmail["demo.farhana@alochitosongbad.local"].id; dutyDate = DateOnly 0; shift = "MORNING"; checkInTime = "09:05:00"; checkOutTime = $null; status = "PRESENT"; dutyNote = "National desk morning reporting shift." },
    @{ staffId = $staffByEmail["demo.rafiq@alochitosongbad.local"].id; dutyDate = DateOnly 0; shift = "FULL_DAY"; checkInTime = "10:10:00"; checkOutTime = $null; status = "LATE"; dutyNote = "Photo coverage for city assignments." },
    @{ staffId = $staffByEmail["demo.nadia@alochitosongbad.local"].id; dutyDate = DateOnly 0; shift = "EVENING"; checkInTime = $null; checkOutTime = $null; status = "SCHEDULED"; dutyNote = "Evening assignment desk coordination." },
    @{ staffId = $staffByEmail["demo.tanvir@alochitosongbad.local"].id; dutyDate = DateOnly 1; shift = "MORNING"; checkInTime = $null; checkOutTime = $null; status = "SCHEDULED"; dutyNote = "Video package edits and field support." },
    @{ staffId = $staffByEmail["demo.mushfiq@alochitosongbad.local"].id; dutyDate = DateOnly 1; shift = "EVENING"; checkInTime = $null; checkOutTime = $null; status = "SCHEDULED"; dutyNote = "Desk editing and homepage update." }
)

foreach ($seed in $attendanceSeeds) {
    [void](Ensure-DemoRecord -Path $attendancePath -Existing $attendance -Match { $_.staffId -eq $seed.staffId -and $_.dutyDate -eq $seed.dutyDate -and $_.shift -eq $seed.shift } -Payload $seed -Label "Attendance $($seed.dutyDate) $($seed.shift)")
}

# Assets
$assets = Get-OperationsList $assetPath
$assetSeeds = @(
    @{ assetName = "Canon camera"; assetType = "CAMERA"; serialNumber = "DEMO-CAM-001"; assignedStaffId = $staffByEmail["demo.rafiq@alochitosongbad.local"].id; purchaseDate = DateOnly -420; purchasePrice = 145000; conditionStatus = "GOOD"; availabilityStatus = "ASSIGNED"; notes = "Primary field camera for photo desk." },
    @{ assetName = "Sony wireless mic"; assetType = "MICROPHONE"; serialNumber = "DEMO-MIC-001"; assignedStaffId = $staffByEmail["demo.tanvir@alochitosongbad.local"].id; purchaseDate = DateOnly -260; purchasePrice = 28000; conditionStatus = "GOOD"; availabilityStatus = "ASSIGNED"; notes = "Used for video interviews." },
    @{ assetName = "Dell editing laptop"; assetType = "LAPTOP"; serialNumber = "DEMO-LAP-001"; assignedStaffId = $staffByEmail["demo.mushfiq@alochitosongbad.local"].id; purchaseDate = DateOnly -360; purchasePrice = 98000; conditionStatus = "GOOD"; availabilityStatus = "ASSIGNED"; notes = "Desk editing laptop." },
    @{ assetName = "Tripod"; assetType = "TRIPOD"; serialNumber = "DEMO-TRI-001"; assignedStaffId = $null; purchaseDate = DateOnly -520; purchasePrice = 9500; conditionStatus = "GOOD"; availabilityStatus = "AVAILABLE"; notes = "Shared field tripod." },
    @{ assetName = "Portable light"; assetType = "LIGHTING"; serialNumber = "DEMO-LGT-001"; assignedStaffId = $null; purchaseDate = DateOnly -190; purchasePrice = 12500; conditionStatus = "NEW"; availabilityStatus = "AVAILABLE"; notes = "Portable LED light for interviews." },
    @{ assetName = "Field recorder"; assetType = "MICROPHONE"; serialNumber = "DEMO-REC-001"; assignedStaffId = $null; purchaseDate = DateOnly -310; purchasePrice = 18000; conditionStatus = "NEEDS_REPAIR"; availabilityStatus = "UNDER_MAINTENANCE"; notes = "Audio level dial needs service." }
)

foreach ($seed in $assetSeeds) {
    [void](Ensure-DemoRecord -Path $assetPath -Existing $assets -Match { $_.serialNumber -eq $seed.serialNumber } -Payload $seed -Label "Asset $($seed.assetName)")
}

# Vendors / Suppliers
$vendors = Get-OperationsList $vendorPath
$vendorSeeds = @(
    @{ vendorName = "Camera House BD"; companyName = "Camera House BD"; contactPerson = "Shahidul Islam"; phone = "01933003001"; email = "sales@camerahousebd.example"; address = "Baitul Mukarram Market, Dhaka"; vendorType = "EQUIPMENT"; status = "ACTIVE"; notes = "Camera, lens, battery, and field accessories supplier." },
    @{ vendorName = "PrintPoint Press"; companyName = "PrintPoint Press"; contactPerson = "Anika Sultana"; phone = "01933003002"; email = "orders@printpoint.example"; address = "Fakirapool, Dhaka"; vendorType = "PRINTING"; status = "ACTIVE"; notes = "Printing for cards, banners, and office stationery." },
    @{ vendorName = "Tech Valley Computers"; companyName = "Tech Valley Computers"; contactPerson = "Jamal Uddin"; phone = "01933003003"; email = "corporate@techvalley.example"; address = "IDB Bhaban, Dhaka"; vendorType = "INTERNET_TECH"; status = "ACTIVE"; notes = "Computers, storage, networking support." },
    @{ vendorName = "City Transport Service"; companyName = "City Transport Service"; contactPerson = "Mizanur Rahman"; phone = "01933003004"; email = "booking@citytransport.example"; address = "Mohakhali, Dhaka"; vendorType = "TRANSPORT"; status = "ACTIVE"; notes = "Assignment car and microbus support." }
)

foreach ($seed in $vendorSeeds) {
    [void](Ensure-DemoRecord -Path $vendorPath -Existing $vendors -Match { $_.vendorName -eq $seed.vendorName } -Payload $seed -Label "Vendor $($seed.vendorName)")
}
$vendors = Get-OperationsList $vendorPath
$vendorByName = Index-ByField -Items $vendors -Field "vendorName"

# Purchase requests
$purchaseRequests = Get-OperationsList $purchaseRequestPath
$purchaseRequestSeeds = @(
    @{ title = "Camera memory cards"; requestedByStaffId = $staffByEmail["demo.rafiq@alochitosongbad.local"].id; departmentId = $departmentByCode["DEMO-CITY"].id; itemDescription = "Four 128GB UHS-II SD cards for photo and video coverage."; estimatedAmount = 18000; requestDate = DateOnly -1; neededByDate = DateOnly 3; priority = "HIGH"; status = "SUBMITTED"; notes = "Needed before weekend field assignments." },
    @{ title = "Field microphone"; requestedByStaffId = $staffByEmail["demo.tanvir@alochitosongbad.local"].id; departmentId = $departmentByCode["DEMO-DIGITAL"].id; itemDescription = "Compact shotgun microphone for mobile video package."; estimatedAmount = 24000; requestDate = DateOnly -2; neededByDate = DateOnly 5; priority = "MEDIUM"; status = "APPROVED"; notes = "Approved for digital desk video workflow." },
    @{ title = "Office stationery"; requestedByStaffId = $staffByEmail["demo.imran@alochitosongbad.local"].id; departmentId = $departmentByCode["DEMO-FIN"].id; itemDescription = "Printer paper, folders, pens, and desk notebooks."; estimatedAmount = 8500; requestDate = DateOnly 0; neededByDate = DateOnly 4; priority = "LOW"; status = "DRAFT"; notes = "Monthly office stationery restock." },
    @{ title = "Backup hard drive"; requestedByStaffId = $staffByEmail["demo.mushfiq@alochitosongbad.local"].id; departmentId = $departmentByCode["DEMO-DIGITAL"].id; itemDescription = "Two 4TB external hard drives for media backup."; estimatedAmount = 32000; requestDate = DateOnly -3; neededByDate = DateOnly 7; priority = "HIGH"; status = "SUBMITTED"; notes = "Needed for video archive workflow." }
)

foreach ($seed in $purchaseRequestSeeds) {
    [void](Ensure-DemoRecord -Path $purchaseRequestPath -Existing $purchaseRequests -Match { $_.title -eq $seed.title } -Payload $seed -Label "Purchase request $($seed.title)")
}
$purchaseRequests = Get-OperationsList $purchaseRequestPath
$purchaseRequestByTitle = Index-ByField -Items $purchaseRequests -Field "title"

# Purchase orders
$purchaseOrders = Get-OperationsList $purchaseOrderPath
$purchaseOrderSeeds = @(
    @{ purchaseRequestId = $purchaseRequestByTitle["Camera memory cards"].id; vendorId = $vendorByName["Camera House BD"].id; orderNumber = "PO-AS-2026-001"; title = "Memory card purchase order"; orderDate = DateOnly 0; expectedDeliveryDate = DateOnly 2; totalAmount = 18000; paymentStatus = "UNPAID"; orderStatus = "PLACED"; notes = "Deliver to newsroom reception." },
    @{ purchaseRequestId = $purchaseRequestByTitle["Field microphone"].id; vendorId = $vendorByName["Camera House BD"].id; orderNumber = "PO-AS-2026-002"; title = "Field microphone purchase order"; orderDate = DateOnly -1; expectedDeliveryDate = DateOnly 4; totalAmount = 24000; paymentStatus = "PARTIAL"; orderStatus = "PLACED"; notes = "Advance paid, balance on delivery." },
    @{ purchaseRequestId = $purchaseRequestByTitle["Backup hard drive"].id; vendorId = $vendorByName["Tech Valley Computers"].id; orderNumber = "PO-AS-2026-003"; title = "Backup hard drive purchase order"; orderDate = DateOnly -2; expectedDeliveryDate = DateOnly 1; totalAmount = 32000; paymentStatus = "PAID"; orderStatus = "RECEIVED"; notes = "Received by digital desk." }
)

foreach ($seed in $purchaseOrderSeeds) {
    [void](Ensure-DemoRecord -Path $purchaseOrderPath -Existing $purchaseOrders -Match { $_.orderNumber -eq $seed.orderNumber } -Payload $seed -Label "Purchase order $($seed.orderNumber)")
}

# Leave requests
$leaveRequests = Get-OperationsList $leaveRequestPath
$leaveSeeds = @(
    @{ staffId = $staffByEmail["demo.farhana@alochitosongbad.local"].id; leaveType = "CASUAL"; startDate = DateOnly 6; endDate = DateOnly 7; totalDays = 2; reason = "Family program outside Dhaka."; status = "PENDING"; reviewerName = ""; reviewNote = "" },
    @{ staffId = $staffByEmail["demo.rafiq@alochitosongbad.local"].id; leaveType = "SICK"; startDate = DateOnly 1; endDate = DateOnly 1; totalDays = 1; reason = "Medical checkup."; status = "PENDING"; reviewerName = ""; reviewNote = "" },
    @{ staffId = $staffByEmail["demo.tanvir@alochitosongbad.local"].id; leaveType = "EARNED"; startDate = DateOnly -8; endDate = DateOnly -6; totalDays = 3; reason = "Previously planned family leave."; status = "APPROVED"; reviewerName = "Nadia Rahman"; reviewNote = "Approved after shift coverage arranged." }
)

foreach ($seed in $leaveSeeds) {
    [void](Ensure-DemoRecord -Path $leaveRequestPath -Existing $leaveRequests -Match { $_.staffId -eq $seed.staffId -and $_.startDate -eq $seed.startDate -and $_.leaveType -eq $seed.leaveType } -Payload $seed -Label "Leave request $($seed.leaveType) $($seed.startDate)")
}

# Staff documents / HR notes
$staffDocuments = Get-OperationsList $staffDocumentPath
$documentSeeds = @(
    @{ staffId = $staffByEmail["demo.farhana@alochitosongbad.local"].id; title = "NID copy note"; documentType = "ID_PROOF"; fileUrl = ""; note = "NID copy verified and stored in HR folder."; status = "ACTIVE" },
    @{ staffId = $staffByEmail["demo.samia@alochitosongbad.local"].id; title = "Appointment letter note"; documentType = "CONTRACT"; fileUrl = ""; note = "Appointment letter signed for advertising desk role."; status = "ACTIVE" },
    @{ staffId = $staffByEmail["demo.rafiq@alochitosongbad.local"].id; title = "Emergency contact update"; documentType = "NOTE"; fileUrl = ""; note = "Emergency contact phone updated after HR review."; status = "ACTIVE" }
)

foreach ($seed in $documentSeeds) {
    [void](Ensure-DemoRecord -Path $staffDocumentPath -Existing $staffDocuments -Match { $_.staffId -eq $seed.staffId -and $_.title -eq $seed.title } -Payload $seed -Label "Staff document $($seed.title)")
}

# Notifications
$notifications = Get-OperationsList $notificationPath
$notificationSeeds = @(
    @{ title = "Payment follow-up reminder"; message = "Follow up with Dhaka Mart and EduCare Coaching for pending campaign payments."; notificationType = "REMINDER"; sourceModule = "Invoices"; sourceEntityId = $null; dueAt = DateTimeValue 1 11 },
    @{ title = "Assignment deadline reminder"; message = "Press briefing coverage needs desk review before evening publishing window."; notificationType = "WARNING"; sourceModule = "Assignments"; sourceEntityId = $null; dueAt = DateTimeValue 0 18 },
    @{ title = "Asset return reminder"; message = "Confirm field tripod and portable light availability before tomorrow morning shift."; notificationType = "REMINDER"; sourceModule = "Assets"; sourceEntityId = $null; dueAt = DateTimeValue 1 9 },
    @{ title = "Leave request pending notice"; message = "Two leave requests are waiting for editorial review."; notificationType = "APPROVAL"; sourceModule = "Leave Requests"; sourceEntityId = $null; dueAt = DateTimeValue 0 16 }
)

foreach ($seed in $notificationSeeds) {
    [void](Ensure-DemoRecord -Path $notificationPath -Existing $notifications -Match { $_.title -eq $seed.title } -Payload $seed -Label "Notification $($seed.title)")
}

Write-Host ""
Write-Host "Media Operations demo data seeding finished."
Write-Host "Refresh the CMS dashboard and Media Operations pages to see the populated demo data."
