# Build a 3-slide AiTravel project summary with PowerPoint COM.
$ErrorActionPreference = "Stop"

function RGBv {
  param([int]$r, [int]$g, [int]$b)
  return $r + $g * 256 + $b * 65536
}

function AddText {
  param(
    $slide, [double]$left, [double]$top, [double]$width, [double]$height,
    [string]$text, [double]$size, [int]$bold, [int]$color,
    [int]$align = 1, [int]$anchor = 1
  )
  $box = $slide.Shapes.AddTextbox(1, $left, $top, $width, $height)
  $tf = $box.TextFrame
  $tf.WordWrap = -1
  $tf.MarginLeft = 0
  $tf.MarginRight = 0
  $tf.MarginTop = 0
  $tf.MarginBottom = 0
  $tf.VerticalAnchor = $anchor
  $tr = $tf.TextRange
  $tr.Text = $text
  $tr.Font.Name = "Calibri"
  $tr.Font.Size = $size
  $tr.Font.Bold = $bold
  $tr.Font.Color.RGB = $color
  $tr.ParagraphFormat.Alignment = $align
  $tr.ParagraphFormat.SpaceBefore = 0
  $tr.ParagraphFormat.SpaceAfter = 0
  return $box
}

function AddRect {
  param(
    $slide, [double]$left, [double]$top, [double]$width, [double]$height,
    [int]$fill, [int]$line = -1, [int]$shape = 1
  )
  $shp = $slide.Shapes.AddShape($shape, $left, $top, $width, $height)
  $shp.Fill.Visible = -1
  $shp.Fill.ForeColor.RGB = $fill
  $shp.Shadow.Visible = 0
  if ($line -ge 0) {
    $shp.Line.Visible = -1
    $shp.Line.ForeColor.RGB = $line
    $shp.Line.Weight = 0.75
  } else {
    $shp.Line.Visible = 0
  }
  return $shp
}

function AddCallout {
  param(
    $slide, [double]$left, [double]$top, [double]$width, [double]$height,
    [int]$fill, [string]$text, [double]$size, [int]$color, [int]$align = 1
  )
  $shp = $slide.Shapes.AddShape(1, $left, $top, $width, $height)
  $shp.Fill.Visible = -1
  $shp.Fill.ForeColor.RGB = $fill
  $shp.Line.Visible = 0
  $shp.Shadow.Visible = 0
  $tf = $shp.TextFrame
  $tf.WordWrap = -1
  $tf.AutoSize = 0
  $tf.MarginLeft = 24
  $tf.MarginRight = 24
  $tf.MarginTop = 0
  $tf.MarginBottom = 0
  $tf.VerticalAnchor = 3
  $tr = $tf.TextRange
  $tr.Text = $text
  $tr.Font.Name = "Calibri"
  $tr.Font.Size = $size
  $tr.Font.Bold = 0
  $tr.Font.Color.RGB = $color
  $tr.ParagraphFormat.Alignment = $align
  $tr.ParagraphFormat.SpaceBefore = 0
  $tr.ParagraphFormat.SpaceAfter = 0
  return $shp
}

function AddBullet {
  param($slide, [double]$left, [double]$top, [double]$width, [string]$text, [double]$size, [int]$color)
  $dot = [char]0x2022
  AddText $slide $left $top $width 26 "$dot  $text" $size 0 $color 1 1 | Out-Null
}

function AddHeading {
  param($slide, [double]$left, [double]$top, [double]$width, [string]$text, [int]$color, [int]$accent)
  AddText $slide $left $top $width 24 $text 14 -1 $color 1 1 | Out-Null
  AddRect $slide $left ($top + 26) 42 3 $accent | Out-Null
}

function AddHeader {
  param($slide, [string]$title, [string]$subtitle)
  AddRect $slide 0 0 960 100 $navy | Out-Null
  AddRect $slide 0 100 960 4 $blue | Out-Null
  AddText $slide 54 22 640 40 $title 30 -1 $white 1 1 | Out-Null
  AddText $slide 56 66 700 22 $subtitle 11 0 $pale 1 1 | Out-Null
  AddText $slide 740 32 160 20 "PROJECT SUMMARY" 9 -1 $pale 3 1 | Out-Null
}

function AddFooter {
  param($slide, [int]$page)
  $line = $slide.Shapes.AddLine(60, 498, 900, 498)
  $line.Line.ForeColor.RGB = $rule
  $line.Line.Weight = 0.75
  AddText $slide 60 508 600 16 "AiTravel Booking System  |  Project Management Summary  |  06 November 2026" 8.5 0 $muted 1 1 | Out-Null
  AddText $slide 840 508 60 16 "$page / 3" 8.5 0 $muted 3 1 | Out-Null
}

# ---- palette ----
$navy  = RGBv 31 56 100
$blue  = RGBv 79 140 255
$pale  = RGBv 199 214 245
$light = RGBv 247 249 253
$white = RGBv 255 255 255
$dark  = RGBv 27 36 51
$muted = RGBv 90 107 133
$rule  = RGBv 219 226 238
$soft  = RGBv 232 240 255
$green = RGBv 46 160 110
$amber = RGBv 214 150 40
$red   = RGBv 200 80 90

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
$ppt.DisplayAlerts = 1

$pres = $ppt.Presentations.Add()
$pres.PageSetup.SlideWidth = 960
$pres.PageSetup.SlideHeight = 540

# ============================== SLIDE 1 ==============================
$s = $pres.Slides.Add(1, 12)
$s.FollowMasterBackground = 0
$s.Background.Fill.Solid()
$s.Background.Fill.ForeColor.RGB = $light

AddHeader $s "AiTravel Booking System" "AI-assisted trip planning in one workspace  |  06 Oct - 06 Nov 2026"

# KPI cards
$cards = @(
  @("24", "working days", $navy),
  @("5", "one-week timeboxes", $blue),
  @("GBP 0", "cash spend", $green),
  @("16 / 16", "Musts delivered", $amber)
)
$cx = @(60, 275, 490, 705)
for ($i = 0; $i -lt 4; $i++) {
  $x = $cx[$i]
  AddRect $s $x 120 195 86 $white $rule | Out-Null
  AddRect $s $x 120 195 4 $cards[$i][2] | Out-Null
  AddText $s ($x + 14) 132 167 32 $cards[$i][0] 21 -1 $cards[$i][2] 1 1 | Out-Null
  AddText $s ($x + 14) 172 167 20 $cards[$i][1] 9.5 0 $muted 1 1 | Out-Null
}

AddHeading $s 60 230 380 "The problem" $navy $blue
AddBullet $s 60 268 380 "6-9 tabs to plan one trip" 11.5 $dark
AddBullet $s 60 298 380 "Weather is read but never applied" 11.5 $dark
AddBullet $s 60 328 380 "Recommendations are generic and price-only" 11.5 $dark

AddHeading $s 510 230 380 "The solution" $navy $blue
AddBullet $s 510 268 380 "One destination context, seven modules" 11.5 $dark
AddBullet $s 510 298 380 "Weather- and persona-aware day plans" 11.5 $dark
AddBullet $s 510 328 380 "Keyless content; one optional Duffel token" 11.5 $dark

$call = AddCallout $s 60 382 840 70 $soft "MVP delivered:  Overview | Highlights | Food & Drink | AiTravel Planner | Flights | Hotels | Cars | Weather Advisor" 10.5 $navy 1
$ctr = $call.TextFrame.TextRange
$ctr.Characters(1, 14).Font.Bold = -1
$ctr.Characters(1, 14).Font.Color.RGB = $blue

AddFooter $s 1

# ============================== SLIDE 2 ==============================
$s = $pres.Slides.Add(2, 12)
$s.FollowMasterBackground = 0
$s.Background.Fill.Solid()
$s.Background.Fill.ForeColor.RGB = $light

AddHeader $s "How it was delivered: MoSCoW Agile" "Fixed date, fixed cost, variable scope - 5 timeboxes"

AddHeading $s 60 128 380 "MoSCoW effort allocation" $navy $blue

$bars = @(
  @("Must", "58%", 58, "16 requirements", $navy),
  @("Should", "24%", 24, "7 requirements", $blue),
  @("Could", "4%", 4, "1 requirement", $green),
  @("Contingency", "14%", 14, "unallocated", $amber)
)
$by = 172
foreach ($b in $bars) {
  AddText $s 60 $by 95 18 $b[0] 11.5 -1 $dark 1 1 | Out-Null
  AddText $s 60 ($by + 18) 95 16 $b[1] 9.5 -1 $b[4] 1 1 | Out-Null
  AddRect $s 165 ($by + 2) 260 15 (RGBv 233 237 245) | Out-Null
  $w = [Math]::Round(260 * [int]$b[2] / 100)
  AddRect $s 165 ($by + 2) $w 15 $b[4] | Out-Null
  AddText $s 437 ($by + 1) 90 18 $b[3] 9 0 $muted 1 1 | Out-Null
  $by += 52
}
AddText $s 60 382 380 20 "Musts are capped below 60% so contingency is real, not theoretical." 9 0 $muted 1 1 | Out-Null

AddHeading $s 510 128 390 "Five one-week timeboxes" $navy $blue
$tb = @(
  @("I1", "06-09 Oct", "Search, weather, country briefing"),
  @("I2", "12-16 Oct", "Guide listings + district fallback"),
  @("I3", "19-23 Oct", "Duffel Air/Stays, token vault"),
  @("I4", "26-30 Oct", "Persona planner, budget, advisor"),
  @("I5", "02-06 Nov", "Hardening, documentation, release")
)
$ty = 170
foreach ($t in $tb) {
  AddText $s 510 $ty 32 18 $t[0] 11.5 -1 $blue 1 1 | Out-Null
  AddText $s 545 $ty 82 18 $t[1] 10 0 $muted 1 1 | Out-Null
  AddText $s 632 $ty 268 18 $t[2] 10.5 0 $dark 1 1 | Out-Null
  $ty += 40
}

$box = AddCallout $s 60 414 840 68 $navy "Time is fixed; scope flexes.  A new Must displaces a Should or Could, and every Must is demonstrated before it is accepted." 11 $white 1
$btr = $box.TextFrame.TextRange
$btr.Characters(1, 28).Font.Bold = -1
$btr.Characters(1, 28).Font.Color.RGB = $pale

AddFooter $s 2

# ============================== SLIDE 3 ==============================
$s = $pres.Slides.Add(3, 12)
$s.FollowMasterBackground = 0
$s.Background.Fill.Solid()
$s.Background.Fill.ForeColor.RGB = $light

AddHeader $s "Key takeaways" "What worked, what to fix, and what comes next"

AddHeading $s 60 128 260 "What worked" $navy $green
AddBullet $s 60 170 260 "Keyless, zero-dependency stack" 10.5 $dark
AddBullet $s 60 214 260 "Proxy as single egress + cache" 10.5 $dark
AddBullet $s 60 258 260 "Failure-first UI: no blank panels" 10.5 $dark
AddBullet $s 60 302 260 "Deterministic planner: fast, auditable, no invented places" 10.5 $dark

AddHeading $s 350 128 260 "What to fix" $navy $amber
AddBullet $s 350 170 260 "No automated test suite yet" 10.5 $dark
AddBullet $s 350 214 260 "Business KPIs are not instrumented" 10.5 $dark
AddBullet $s 350 258 260 "Single HTML file is hard to edit" 10.5 $dark
AddBullet $s 350 302 260 "WCAG 2.1 AA audit outstanding" 10.5 $dark

AddHeading $s 640 128 260 "What's next" $navy $blue
AddBullet $s 640 170 260 "Run interviews + survey (n=60)" 10.5 $dark
AddBullet $s 640 214 260 "Instrument outbound clicks" 10.5 $dark
AddBullet $s 640 258 260 "Decide Phase B: LLM narration" 10.5 $dark
AddBullet $s 640 302 260 "Add RAG + citation gate after 50 destinations" 10.5 $dark

AddText $s 60 372 840 20 "46 pages  |  61 tables  |  24 requirements  |  24 user stories  |  17 risks" 9.5 0 $muted 1 1 | Out-Null

$rec = AddCallout $s 60 404 840 64 $navy "Recommendation: ship the deterministic MVP, measure real demand, then add LLM + RAG behind a citation gate." 11.5 $white 2
$rec.TextFrame.TextRange.Font.Bold = -1

AddFooter $s 3

$out = "C:\Users\ifti_\Documents\Default Project\AiTravel_Project_Summary_Slides.pptx"
$pres.SaveAs($out, 24)
$pres.Close()
$ppt.Quit()

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($s) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null

Write-Output "saved $out"
