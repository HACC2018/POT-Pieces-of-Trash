import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NbMenuService, NbSidebarService } from '@nebular/theme';
import { LayoutService } from '../../../@core/data/layout.service';
import { UploadImageModalComponent } from './upload-image-modal/upload-image-modal.component';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {

  @Input() position = 'normal';

  constructor(private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private layoutService: LayoutService,
              private modalService: NgbModal) {
  }

  ngOnInit() {}

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  toggleSettings(): boolean {
    this.sidebarService.toggle(false, 'settings-sidebar');

    return false;
  }

  goToHome() {
    this.menuService.navigateHome();
  }

  startSearch() {
  }

  goToUploadImage() {
    this.modalService.open(UploadImageModalComponent, { size: 'lg', container: 'nb-layout' });
  }
}
