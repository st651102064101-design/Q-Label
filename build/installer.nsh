!macro customPageAfterChangeDir
  Function EnsureInstallDirFinal
    StrLen $1 "${APP_FILENAME}"
    IntOp $2 0 - $1
    StrCpy $3 "$INSTDIR" $1 $2
    StrCmp $3 "${APP_FILENAME}" +2 0
      StrCpy $INSTDIR "$INSTDIR\${APP_FILENAME}"
    CreateDirectory "$INSTDIR"
  FunctionEnd

  Function .onVerifyInstDir
    Call EnsureInstallDirFinal
  FunctionEnd
!macroend

!macro customInstall
  Call EnsureInstallDirFinal
!macroend
